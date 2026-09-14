// The ONLY module in the app that talks to api.github.com. All repo access
// goes through these helpers. Two token types, two clients (see 02):
//   - User token (ghu_…, 8h + refresh)  → repo creation + installation lookup.
//     Creating a repo in a personal account requires user auth.
//   - Installation token (minted on demand, 1h) → all steady-state repo ops
//     (tree, read, write, commit). Scoped to exactly what the teacher
//     installed — the trust win over OAuth's broad `repo` scope.
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

function isRequestError(err: unknown, ...statuses: number[]): boolean {
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
  return new Octokit({ auth: token });
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
    });
  }
  return cachedApp;
}

/** Octokit authenticated as an app installation (1h token, auto-renewed). */
export async function getInstallationOctokit(installationId: number) {
  return getApp().getInstallationOctokit(installationId);
}

// ─── Repo creation (user token) ──────────────────────────────────────────

const MAX_NAME_ATTEMPTS = 5;

/**
 * Create the teacher's private workspace repo with the USER token (creating
 * a repo in a personal account requires user auth). No template: the repo
 * starts nearly empty — `auto_init` lands the initial commit (a default
 * README.md) that commitMany's HEAD requirement needs, and provisioning (07)
 * seeds 00-Profile/ and 01-Start Here/ itself.
 * On a 422 name collision, retries as `<repoName>-2`, `-3`, …
 * Persists the result into the session's `repo` field — it becomes the
 * primary workspace lookup (99 issue 4).
 */
export async function createWorkspaceRepo(
  session: Session,
  repoName: string = WORKSPACE_REPO_NAME,
): Promise<SessionRepo> {
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
  return match ? { owner: match.owner, name: match.name } : null;
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
