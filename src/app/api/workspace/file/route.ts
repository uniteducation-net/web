// 10 step 1: read a single file from the teacher's repo for the center
// markdown preview. The returned `sha` round-trips to the client, which keeps
// it in state for safe writes (11 — the agent panel's optimistic-concurrency
// updates). PUT lands with that step.
// Plan: docs/plans/icm-workspace-plan/10-markdown-preview.md

import { NextResponse, type NextRequest } from "next/server";
import { RequestError } from "octokit";
import { getSession } from "@/lib/session";
import { GitHubRateLimitError, readFile } from "@/lib/github";

/**
 * Repo-relative path guard. The client only ever sends paths from the tree
 * (09), but this is a public-ish endpoint reading a private repo — reject
 * traversal, absolute paths, and empty segments outright.
 */
function isValidPath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 500 &&
    !path.startsWith("/") &&
    !path.endsWith("/") &&
    !path.includes("\\") &&
    !/[\x00-\x1f]/.test(path) && // no control characters
    path.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..")
  );
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (!session.installationId || !session.repo) {
    // The /workspace guard (04) normally prevents this state entirely.
    return NextResponse.json({ error: "no_workspace" }, { status: 409 });
  }
  const { installationId, repo } = session;

  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!isValidPath(path)) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  try {
    const file = await readFile(installationId, repo.owner, repo.name, path);
    return NextResponse.json({ path, content: file.content, sha: file.sha });
  } catch (err) {
    if (err instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: "github_rate_limited", message: err.message },
        { status: 503 },
      );
    }
    if (err instanceof RequestError && err.status === 404) {
      return NextResponse.json({ error: "file_not_found" }, { status: 404 });
    }
    if (err instanceof RequestError && err.status >= 500) {
      return NextResponse.json(
        { error: "github_unavailable" },
        { status: 502 },
      );
    }
    console.error("workspace file read failed:", err);
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }
}

// TODO(11-agent-panel): write a file (pass the sha from GET for
// optimistic concurrency — 409 on mismatch).
export async function PUT() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
