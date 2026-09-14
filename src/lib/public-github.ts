// Live reads of the two PUBLIC repos the workspace depends on — the method
// reference (RinDig/icm-architect, always fetched at its latest version, never
// copied) and the curated Resources bundle. Unauthenticated by default
// (60 req/h); when RESOURCES_INSTALLATION_ID is set, reads go through the
// org's app installation instead (5,000 req/h). Everything is cached in
// module-level Maps (same shape as the tree route's 30s cache), and every
// expected failure — empty repo (409), missing file/repo (404), rate limit —
// returns a cached null. Callers degrade in-band; these repos never crash a
// request. Truly unexpected errors are rethrown.
// Plan: docs/plans/icm-workspace-plan/00-overview.md (final adjustments, step 1)

// Server-only module — never import from client components.

import { Octokit, RequestError } from "octokit";
import {
  GitHubRateLimitError,
  getInstallationOctokit,
  withGitHubGuard,
} from "./github";

export interface PublicTreeEntry {
  path: string;
  sha: string;
}

// TTLs: public content changes rarely, so positive results cache for 5 min
// (the ICM reference for 1 h); negative results for only 60 s so a repo being
// seeded or a rate-limit reset is picked up quickly.
const POSITIVE_TTL_MS = 5 * 60_000;
const ICM_TTL_MS = 60 * 60_000;
const NEGATIVE_TTL_MS = 60_000;

type CacheEntry<T> = { expiresAt: number; value: T };
const treeCache = new Map<string, CacheEntry<PublicTreeEntry[] | null>>();
const fileCache = new Map<string, CacheEntry<string | null>>();
let icmCache: CacheEntry<{ skill: string; core: string } | null> | null = null;

// ─── Repo coordinates ────────────────────────────────────────────────────

/** Split "<owner>/<repo>" with a default — never requireEnv: these repos are
 *  public, so a missing env var must not break the app. */
function splitRepo(full: string): { owner: string; repo: string } {
  const [owner, repo] = full.split("/");
  return { owner, repo };
}

/** The curated resources bundle (public). */
export function resourcesRepoCoords(): { owner: string; repo: string } {
  return splitRepo(process.env.RESOURCES_REPO ?? "uniteducation-net/Resources");
}

/** The live method reference (public) — SKILL.md + references/. */
export function icmReferenceRepoCoords(): { owner: string; repo: string } {
  return splitRepo(process.env.ICM_REFERENCE_REPO ?? "RinDig/icm-architect");
}

// ─── Client ──────────────────────────────────────────────────────────────

// One module-level client for all public reads. Unauthenticated `new Octokit()`
// is enough for public repos; the installation escape hatch exists because
// Vercel's shared IPs can burn through the 60 req/h anonymous budget.
let octokitPromise: Promise<Octokit> | null = null;

function getPublicOctokit(): Promise<Octokit> {
  if (!octokitPromise) {
    const installationId = process.env.RESOURCES_INSTALLATION_ID;
    octokitPromise = installationId
      ? getInstallationOctokit(Number(installationId))
      : Promise.resolve(new Octokit());
  }
  return octokitPromise;
}

/** Expected-unavailability check: 404 (missing), 409 (empty repo), rate limit. */
function isExpectedMiss(err: unknown): boolean {
  return (
    err instanceof GitHubRateLimitError ||
    (err instanceof RequestError && (err.status === 404 || err.status === 409))
  );
}

// ─── Reads ───────────────────────────────────────────────────────────────

/**
 * All blob entries of the repo's HEAD, sorted by path — or null when the repo
 * is empty ("Git Repository is empty" 409s the git-trees API), missing, or
 * rate-limited. Never throws for expected unavailability.
 */
export async function getPublicTree(
  owner: string,
  repo: string,
): Promise<PublicTreeEntry[] | null> {
  const key = `${owner}/${repo}`;
  const cached = treeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let tree: PublicTreeEntry[] | null;
  try {
    const octokit = await getPublicOctokit();
    const { data } = await withGitHubGuard(() =>
      octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: "HEAD",
        recursive: "1",
      }),
    );
    tree = data.tree
      .filter(
        (entry): entry is typeof entry & { path: string; sha: string } =>
          entry.type === "blob" && Boolean(entry.path) && Boolean(entry.sha),
      )
      .map((entry) => ({ path: entry.path, sha: entry.sha }))
      .sort((a, b) => a.path.localeCompare(b.path));
  } catch (err) {
    if (!isExpectedMiss(err)) throw err;
    tree = null;
  }

  treeCache.set(key, {
    expiresAt: Date.now() + (tree === null ? NEGATIVE_TTL_MS : POSITIVE_TTL_MS),
    value: tree,
  });
  return tree;
}

/**
 * utf8 content of one file — or null on 404 / rate limit. Never throws for
 * expected unavailability.
 */
export async function getPublicFile(
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  const key = `${owner}/${repo}:${path}`;
  const cached = fileCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let content: string | null;
  try {
    const octokit = await getPublicOctokit();
    const { data } = await withGitHubGuard(() =>
      octokit.rest.repos.getContent({ owner, repo, path }),
    );
    content =
      Array.isArray(data) || data.type !== "file"
        ? null
        : Buffer.from(data.content, "base64").toString("utf8");
  } catch (err) {
    if (!isExpectedMiss(err)) throw err;
    content = null;
  }

  fileCache.set(key, {
    expiresAt:
      Date.now() + (content === null ? NEGATIVE_TTL_MS : POSITIVE_TTL_MS),
    value: content,
  });
  return content;
}

/**
 * Distinguishes "repo exists but is empty" from "repo unreachable" — a null
 * tree alone can't (an empty repo 409s the same endpoint a rate limit 403s).
 * Callers that care (the Resources index) probe this once on a null tree.
 * Empty is detected via listCommits (409 on a commitless repo): repos.get's
 * `size` field is stale and reads 0 even on seeded repos.
 */
export async function getPublicRepoState(
  owner: string,
  repo: string,
): Promise<"ready" | "empty" | "unavailable"> {
  try {
    const octokit = await getPublicOctokit();
    await withGitHubGuard(() =>
      octokit.rest.repos.listCommits({ owner, repo, per_page: 1 }),
    );
    return "ready";
  } catch (err) {
    if (err instanceof GitHubRateLimitError) return "unavailable";
    if (err instanceof RequestError) {
      // 409 "Git Repository is empty" → exists but commitless.
      if (err.status === 409) return "empty";
      if (err.status === 404) return "unavailable";
    }
    throw err;
  }
}

/**
 * The method reference the workspace agent follows: SKILL.md + the core
 * conventions doc, from the latest version of the public ICM reference repo.
 * Cached for 1 h — it changes rarely and is read on every provisioning.
 */
export async function getIcmReference(): Promise<{
  skill: string;
  core: string;
} | null> {
  if (icmCache && icmCache.expiresAt > Date.now()) return icmCache.value;

  const { owner, repo } = icmReferenceRepoCoords();
  const [skill, core] = await Promise.all([
    getPublicFile(owner, repo, "SKILL.md"),
    getPublicFile(owner, repo, "references/core.md"),
  ]);
  const value = skill !== null && core !== null ? { skill, core } : null;

  icmCache = {
    expiresAt: Date.now() + (value === null ? NEGATIVE_TTL_MS : ICM_TTL_MS),
    value,
  };
  return value;
}
