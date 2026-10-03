// The ONLY module in the app that talks to api.github.com. All repo access
// goes through these helpers. Two token types, two clients (see 02):
//   - User token (ghu_…, 8h + refresh)  → installation lookup + the FALLBACK
//     repo-creation path (POST /user/repos is user-token-only and needs a
//     retroactive permission grant — 99-known-issues #11).
//   - Installation token (minted on demand, 1h) → all steady-state repo ops
//     (tree, read, write, commit) AND the PRIMARY repo-creation path:
//     POST /repos/{template}/generate accepts installation tokens (Contents
//     suffices) when creating in the installation's own account from a public
//     template — no user-token permission upgrades, ever.
// Plan: docs/plans/icm-workspace-plan/03-github-api.md

// Server-only module — never import from client components.

import { App, Octokit, RequestError } from "octokit";
import {
  getSession,
  getValidUserToken,
  requireEnv,
  setSession,
  type Session,
  type SessionRepo,
} from "./session";

/** Suggested repo name (exact case — findExistingWorkspace's prefix scan is
 *  case-sensitive). Teacher-facing name is always "UnitEd Workspace" —
 *  "ICM" stays in our internals, never in what we create for them. */
export const WORKSPACE_REPO_NAME = "UnitEd-Workspace";
/** Marker that identifies a repo as one of ours when scanning installations. */
export const WORKSPACE_DESCRIPTION = "My UnitEd Workspace";

export class GitHubRateLimitError extends Error {
  /** Epoch seconds at which the rate limit resets, if GitHub told us. */
  resetAt: number | null;

  constructor(resetAt: number | null) {
    const when = resetAt
      ? ` Try again after ${new Date(resetAt * 1000).toLocaleTimeString()}.`
      : " Try again in a little while.";
    super(`GitHub's rate limit is exhausted.${when}`);
    this.name = "GitHubRateLimitError";
    this.resetAt = resetAt;
  }
}

/** The app's permissions grew after the user authorized (e.g. Repository
 *  creation granted later) — their user token predates the grant, so
 *  POST /user/repos 403s with "Resource not accessible by integration"
 *  (99-known-issues #11). Only fix: re-authorize; GitHub shows an
 *  updated-permissions approval at the authorize step. */
export class GitHubReauthorizationError extends Error {
  constructor() {
    super(
      "GitHub needs updated permissions — the user must re-authorize the app.",
    );
    this.name = "GitHubReauthorizationError";
  }
}

/** Pin every GitHub client to the current API version — silences the
 *  2022-11-28 deprecation warning (sunset 2028-03-10). The 2026-03-10
 *  breaking changes don't touch us: we read owner.login and default_branch
 *  only, and the new 451 trade-controls status is mapped in 07's route. */
export const GITHUB_API_VERSION = "2026-03-10";

/** Octokit constructor defaults carrying the version header — merged into
 *  every request the client makes. */
const versionedRequest = {
  request: { headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION } },
} as const;

/**
 * Rate-limit guard: wrap every GitHub call in this. On 403 with
 * X-RateLimit-Remaining: 0, surface a friendly error instead of silently
 * hanging or retry-looping into the ban. Exported for public-github.ts
 * (adjustments step 1), which turns GitHubRateLimitError into a cached null.
 */
export async function withGitHubGuard<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if (
      err instanceof RequestError &&
      err.status === 403 &&
      err.response?.headers["x-ratelimit-remaining"] === "0"
    ) {
      const reset = err.response.headers["x-ratelimit-reset"];
      throw new GitHubRateLimitError(reset ? Number(reset) : null);
    }
    throw err;
  }
}

function isRequestError(
  err: unknown,
  ...statuses: number[]
): err is RequestError {
  return err instanceof RequestError && statuses.includes(err.status);
}

// ─── Client factories ────────────────────────────────────────────────────

/**
 * Octokit authenticated as the user. Refreshes the 8h token via the session
 * helper (02 step 1) when needed. The passed session is the caller's copy —
 * `getValidUserToken` re-reads the cookie so it works off the freshest state.
 */
// _session: signature fixed by plan 03; callers (07) pass their session
export async function getUserOctokit(_session: Session): Promise<Octokit> {
  const token = await getValidUserToken();
  if (!token) {
    // Refresh token expired or revoked — treat as logged out.
    throw new Error("GitHub session expired — the user must re-authenticate.");
  }
  return new Octokit({ auth: token, ...versionedRequest });
}

// The App caches and auto-renews the 1h installation tokens internally, so
// one module-level instance serves every request.
let cachedApp: App | null = null;

function getApp(): App {
  if (!cachedApp) {
    const privateKey = Buffer.from(
      requireEnv("GITHUB_APP_PRIVATE_KEY"), // .pem contents, base64-encoded single line
      "base64",
    ).toString("utf8");
    cachedApp = new App({
      appId: requireEnv("GITHUB_APP_ID"),
      privateKey,
      // Every installation octokit the app mints inherits the version pin.
      Octokit: Octokit.defaults(versionedRequest),
    });
  }
  return cachedApp;
}

/** Octokit authenticated as an app installation (1h token, auto-renewed). */
export async function getInstallationOctokit(installationId: number) {
  return getApp().getInstallationOctokit(installationId);
}

/**
 * The app registration's configured permissions (GET /app, JWT-authed).
 * Diagnostics for 99-known-issues #11: logged on the reauthorization path to
 * settle "registration lacks the permission" vs "token predates the grant".
 */
export async function getAppPermissions(): Promise<
  Record<string, string | undefined>
> {
  const { data } = await getApp().octokit.request("GET /app");
  return data?.permissions ?? {};
}

// ─── Repo creation ───────────────────────────────────────────────────────

const MAX_NAME_ATTEMPTS = 5;

/** Optional "owner/repo" of a PUBLIC, nearly-empty template repo used purely
 *  as a creation vehicle: POST /repos/{t_owner}/{t_repo}/generate accepts
 *  INSTALLATION tokens (Contents:read suffices per GitHub's permissions
 *  reference) when creating in the installation's own account — unlike
 *  POST /user/repos, which needs the user token AND retroactive permission
 *  grants (99 #11). The template's lone README is replaced by provisioning's
 *  Start-Here commit; no placeholder/content machinery is reintroduced
 *  (99 #5 stays resolved). Exported for unit tests. */
export function parseWorkspaceTemplateEnv(
  raw: string | undefined = process.env.GITHUB_WORKSPACE_TEMPLATE,
): { owner: string; repo: string } | null {
  if (!raw) return null;
  const parts = raw.split("/");
  if (parts.length !== 2) return null;
  const [owner, repo] = parts;
  return owner && repo ? { owner, repo } : null;
}

/** The /user/installations entries we inspect during auth (02 step 3–4). */
export type UserInstallation = {
  id: number;
  account: { login: string } | null;
};

/**
 * Workspace repos live in the teacher's PERSONAL account ("Your Account,
 * Your data") — an installation on an organization they admin is not a
 * substitute: repo ops and IAT minting against it target the wrong account
 * (cross-account template-generate fails, coverage checks never pass). The
 * /installed route uses this to refuse binding org installations into the
 * session. Exported for unit tests.
 */
export function isPersonalInstallation(
  installation: UserInstallation,
  login: string,
): boolean {
  return installation.account?.login === login;
}

/**
 * PRIMARY creation path (env-gated): template-generate with the installation
 * token. Returns null — caller falls back to the user-token path with
 * byte-identical behavior — when unconfigured, unusable, or failed. Throws
 * only the names-exhausted error (a 422 set the fallback would re-hit
 * identically) and GitHubRateLimitError (never double-hit a rate-limited API).
 */
async function createWorkspaceRepoFromTemplate(
  session: Session,
  repoName: string,
): Promise<SessionRepo | null> {
  const template = parseWorkspaceTemplateEnv();
  if (!template || !session.installationId) return null;

  let octokit: Awaited<ReturnType<typeof getInstallationOctokit>>;
  try {
    octokit = await getInstallationOctokit(session.installationId);
  } catch (err) {
    console.warn(
      "[createWorkspaceRepo] installation client unavailable, falling back to user-token create:",
      err,
    );
    return null;
  }

  for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt++) {
    const name = attempt === 0 ? repoName : `${repoName}-${attempt + 1}`;
    try {
      const { data } = await withGitHubGuard(() =>
        octokit.rest.repos.createUsingTemplate({
          template_owner: template.owner,
          template_repo: template.repo,
          owner: session.user.login,
          name,
          description: WORKSPACE_DESCRIPTION,
          private: true,
          include_all_branches: false,
        }),
      );
      const repo: SessionRepo = { owner: data.owner.login, name: data.name };
      // Same fresh-session re-read as the user-token path (getValidUserToken
      // may have rotated tokens elsewhere just now).
      const fresh = await getSession();
      if (fresh) await setSession({ ...fresh, repo });
      return repo;
    } catch (err) {
      // Name already taken → try the next suffix.
      if (isRequestError(err, 422)) continue;
      if (err instanceof GitHubRateLimitError) throw err;
      // 403 (suspended/select-repos edge), 404 (template renamed/private),
      // 5xx, network → the user-token fallback behaves exactly as before.
      console.warn(
        "[createWorkspaceRepo] template-generate failed, falling back to user-token create:",
        {
          status: err instanceof RequestError ? err.status : "network",
          requestId:
            err instanceof RequestError
              ? err.response?.headers["x-github-request-id"]
              : undefined,
        },
      );
      return null;
    }
  }
  throw new Error(
    `Could not create workspace: every name ${repoName}…${repoName}-${MAX_NAME_ATTEMPTS} is taken.`,
  );
}

/**
 * Create the teacher's private workspace repo. PRIMARY: template-generate
 * with the installation token (above) — every existing installation can
 * create repos with zero permission upgrades. FALLBACK (unchanged): the
 * USER token (creating via POST /user/repos in a personal account requires
 * user auth). No template content is personalized: the repo starts nearly
 * empty — provisioning (07) seeds 00-Profile/ and 01-Start Here/ itself.
 * On a 422 name collision, retries as `<repoName>-2`, `-3`, …
 * Persists the result into the session's `repo` field — it becomes the
 * primary workspace lookup (99 issue 4).
 */
export async function createWorkspaceRepo(
  session: Session,
  repoName: string = WORKSPACE_REPO_NAME,
): Promise<SessionRepo> {
  // Primary: installation-token template-generate (env-gated).
  const fromTemplate = await createWorkspaceRepoFromTemplate(
    session,
    repoName,
  );
  if (fromTemplate) return fromTemplate;

  // Fallback: user-token createForAuthenticatedUser — unchanged, including
  // the 99 #11 diagnostics and GitHubReauthorizationError mapping.
  const octokit = await getUserOctokit(session);

  for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt++) {
    const name = attempt === 0 ? repoName : `${repoName}-${attempt + 1}`;
    try {
      const { data } = await withGitHubGuard(() =>
        octokit.rest.repos.createForAuthenticatedUser({
          name,
          private: true,
          description: WORKSPACE_DESCRIPTION,
          auto_init: true,
        }),
      );
      const repo: SessionRepo = { owner: data.owner.login, name: data.name };
      // Re-read the session before writing: getValidUserToken() may have
      // rotated the tokens just now, and writing the caller's stale copy
      // would resurrect the dead refresh token.
      const fresh = await getSession();
      if (fresh) await setSession({ ...fresh, repo });
      return repo;
    } catch (err) {
      // Name already taken → try the next suffix.
      if (isRequestError(err, 422)) continue;
      // The user token predates a permission grant (99-known-issues #11) —
      // the 403 is permanent until the teacher re-authorizes. Map to a typed
      // error so the route answers with a reconnect CTA instead of a 500.
      if (
        isRequestError(err, 403) &&
        err.message.includes("Resource not accessible by integration")
      ) {
        // Diagnostics for 99 #11 — what GitHub would accept, which app the
        // token belongs to, and the request id for support. Pair with the
        // create route's app-permissions log to tell "registration lacks the
        // permission" from "token predates the grant".
        console.warn("[createWorkspaceRepo] POST /user/repos 403:", {
          accepted: err.response?.headers["x-accepted-github-permissions"],
          clientId: err.response?.headers["x-oauth-client-id"],
          requestId: err.response?.headers["x-github-request-id"],
        });
        throw new GitHubReauthorizationError();
      }
      throw err;
    }
  }
  throw new Error(
    `Could not create workspace: every name ${repoName}…${repoName}-${MAX_NAME_ATTEMPTS} is taken.`,
  );
}

// ─── Workspace lookup ────────────────────────────────────────────────────

/**
 * Every repo the installation covers. Used by the Settings repo-switcher
 * (12) — one workspace at a time, but the teacher can point it at another
 * of their repos.
 */
export async function listAccessibleRepos(
  installationId: number,
): Promise<{ owner: string; name: string; description: string | null }[]> {
  const octokit = await getInstallationOctokit(installationId);
  const repositories = await withGitHubGuard(() =>
    octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, {
      per_page: 100,
    }),
  );
  return repositories.map((r) => ({
    owner: r.owner.login,
    name: r.name,
    description: r.description ?? null,
  }));
}

/**
 * Detect a returning user without a database — their GitHub account is the
 * user store. Primary: verify the session's `repo` still exists (one cheap
 * GET). Fallback: scan the installation's repositories for one whose name
 * starts with our workspace prefix AND whose description matches our marker.
 * A repo found by the scan is persisted back into the session (best effort):
 * the page guard calls this on every /workspace load, which heals a session
 * whose `repo` binding was lost (e.g. written before the callback learned to
 * merge) — the tree/file APIs read only `session.repo`.
 */
export async function findExistingWorkspace(
  session: Session,
): Promise<SessionRepo | null> {
  if (!session.installationId) return null;

  if (session.repo) {
    try {
      const octokit = await getInstallationOctokit(session.installationId);
      await withGitHubGuard(() =>
        octokit.rest.repos.get({
          owner: session.repo!.owner,
          repo: session.repo!.name,
        }),
      );
      return session.repo;
    } catch (err) {
      // 404/403: deleted, renamed, or no longer covered by the installation
      // → fall through to the scan. Anything else is a real failure.
      if (!isRequestError(err, 404, 403)) throw err;
    }
  }

  // Prefix scan is case-sensitive: match the current name and the legacy
  // pre-rename one so a repo created by an earlier deploy is still found.
  const NAME_PREFIXES = [WORKSPACE_REPO_NAME, "united-workspace"];
  const repos = await listAccessibleRepos(session.installationId);
  const match = repos.find(
    (r) =>
      NAME_PREFIXES.some((prefix) => r.name.startsWith(prefix)) &&
      r.description === WORKSPACE_DESCRIPTION,
  );
  if (!match) return null;
  const repo: SessionRepo = { owner: match.owner, name: match.name };

  // Persist the rediscovered binding. Re-read first so a concurrent token
  // rotation is never resurrected; swallow failures — during Server Component
  // render (the /workspace guard) cookie writes are rejected, and the next
  // Route Handler call persists instead.
  try {
    const fresh = await getSession();
    if (
      fresh &&
      (fresh.repo?.owner !== repo.owner || fresh.repo.name !== repo.name)
    ) {
      await setSession({ ...fresh, repo });
    }
  } catch {
    // Best effort — see above.
  }
  return repo;
}

// ─── Steady-state repo ops (installation token) ──────────────────────────

/** All blob entries in the repo, sorted by path. */
export async function getTree(
  installationId: number,
  owner: string,
  repo: string,
): Promise<{ path: string; sha: string }[]> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await withGitHubGuard(() =>
    octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: "HEAD",
      recursive: "1",
    }),
  );
  return data.tree
    .filter(
      (entry): entry is typeof entry & { path: string; sha: string } =>
        entry.type === "blob" && Boolean(entry.path) && Boolean(entry.sha),
    )
    .map((entry) => ({ path: entry.path, sha: entry.sha }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Read a single file. Always keep the returned `sha` — it is required for
 * updates (writeFile).
 */
export async function readFile(
  installationId: number,
  owner: string,
  repo: string,
  path: string,
): Promise<{ content: string; sha: string }> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await withGitHubGuard(() =>
    octokit.rest.repos.getContent({ owner, repo, path }),
  );
  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Not a file: ${path}`);
  }
  return {
    content: Buffer.from(data.content, "base64").toString("utf8"),
    sha: data.sha,
  };
}

/**
 * Create or update a single file. Every write is a real commit with a
 * human-readable message (e.g. "Update voice rules via workspace chat") —
 * this is the user's version history, treat it with respect. Commits are
 * authored by the app bot (`<app-slug>[bot]`) — correct and transparent.
 * Pass the `sha` from readFile when updating an existing file.
 */
export async function writeFile(
  installationId: number,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<{ sha: string }> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await withGitHubGuard(() =>
    octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      ...(sha ? { sha } : {}),
    }),
  );
  return { sha: data.content?.sha ?? "" };
}

/**
 * Write many files in ONE commit (used by provisioning, 07 — the whole
 * seed lands as a single commit instead of N noisy ones).
 * Git Data API: blobs → tree (based on HEAD) → commit → update ref.
 * Requires an existing HEAD: repos from createWorkspaceRepo have one via
 * `auto_init`; the create route handles the empty-repo edge with writeFile.
 */
export async function commitMany(
  installationId: number,
  owner: string,
  repo: string,
  files: { path: string; content: string }[],
  message: string,
): Promise<{ sha: string }> {
  if (files.length === 0) {
    throw new Error("commitMany requires at least one file.");
  }
  const octokit = await getInstallationOctokit(installationId);

  const { data: repoData } = await withGitHubGuard(() =>
    octokit.rest.repos.get({ owner, repo }),
  );
  const branch = repoData.default_branch;

  const { data: ref } = await withGitHubGuard(() =>
    octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` }),
  );
  const headSha = ref.object.sha;

  const { data: headCommit } = await withGitHubGuard(() =>
    octokit.rest.git.getCommit({ owner, repo, commit_sha: headSha }),
  );

  const blobs = await Promise.all(
    files.map((file) =>
      withGitHubGuard(() =>
        octokit.rest.git.createBlob({
          owner,
          repo,
          content: file.content,
          encoding: "utf-8",
        }),
      ).then(({ data }) => ({
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: data.sha,
      })),
    ),
  );

  const { data: tree } = await withGitHubGuard(() =>
    octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: headCommit.tree.sha,
      tree: blobs,
    }),
  );

  const { data: commit } = await withGitHubGuard(() =>
    octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: tree.sha,
      parents: [headSha],
    }),
  );

  await withGitHubGuard(() =>
    octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
    }),
  );

  return { sha: commit.sha };
}

// ─── Installation coverage check ─────────────────────────────────────────

/**
 * Safety net for "Only select repositories" installs (02's install copy tells
 * teachers to keep "All repositories" selected). Call right after
 * createWorkspaceRepo: if the new repo isn't covered, `covered` is
 * false and `fixUrl` is a deep link that grants access in one click — the
 * caller should respond with it, let the teacher click, then retry.
 */
export async function checkInstallationCoverage(
  installationId: number,
  owner: string,
  repo: string,
): Promise<{ covered: true } | { covered: false; fixUrl: string }> {
  try {
    await getTree(installationId, owner, repo);
    return { covered: true };
  } catch (err) {
    if (isRequestError(err, 404, 403)) {
      const slug = requireEnv("GITHUB_APP_SLUG");
      return {
        covered: false,
        fixUrl: `https://github.com/apps/${slug}/installations/${installationId}`,
      };
    }
    throw err;
  }
}
