// 09 step 1: the teacher's repo file tree for the left sidebar.
// Returns the flat blob list `{ path, sha }[]` (sorted by path) — nesting is
// a client concern (file-tree.tsx). Cached in-memory for 30s per workspace:
// the preview (10) and agent panel (11) also want this data, and the git
// trees API is the one call we would otherwise hammer.
// Plan: docs/plans/icm-workspace-plan/09-file-tree.md

import { NextResponse } from "next/server";
import { RequestError } from "octokit";
import { getSession } from "@/lib/session";
import { GitHubRateLimitError, getTree } from "@/lib/github";

const CACHE_TTL_MS = 30_000;

type TreeEntry = { path: string; sha: string };
const treeCache = new Map<string, { expiresAt: number; tree: TreeEntry[] }>();

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (!session.installationId || !session.repo) {
    // The /workspace guard (04) normally prevents this state entirely.
    return NextResponse.json({ error: "no_workspace" }, { status: 409 });
  }
  const { installationId, repo } = session;

  const cacheKey = `${installationId}:${repo.owner}/${repo.name}`;
  const cached = treeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.tree);
  }

  try {
    const tree = await getTree(installationId, repo.owner, repo.name);
    treeCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, tree });
    return NextResponse.json(tree);
  } catch (err) {
    if (err instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: "github_rate_limited", message: err.message },
        { status: 503 },
      );
    }
    if (err instanceof RequestError && err.status >= 500) {
      return NextResponse.json(
        { error: "github_unavailable" },
        { status: 502 },
      );
    }
    console.error("workspace tree failed:", err);
    return NextResponse.json({ error: "tree_failed" }, { status: 500 });
  }
}
