// 12 step 3 — repo picker data for the Settings workspace-switcher: every
// repo the teacher's app installation covers (listAccessibleRepos, 03 step
// 3), plus the installation-settings deep link for "my repo isn't listed —
// grant it first, then retry". GITHUB_APP_SLUG may still be a placeholder
// (01) — degrade to `null` instead of throwing so Settings keeps working.
// Plan: docs/plans/icm-workspace-plan/12-settings.md

import { NextResponse } from "next/server";
import { RequestError } from "octokit";
import { getSession } from "@/lib/session";
import { GitHubRateLimitError, listAccessibleRepos } from "@/lib/github";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (!session.installationId) {
    return NextResponse.json({ error: "no_installation" }, { status: 409 });
  }
  const { installationId } = session;

  const slug = process.env.GITHUB_APP_SLUG;
  const installationUrl = slug
    ? `https://github.com/apps/${slug}/installations/${installationId}`
    : null;

  try {
    const repos = await listAccessibleRepos(installationId);
    return NextResponse.json({ repos, installationUrl });
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
    console.error("settings repos list failed:", err);
    return NextResponse.json({ error: "repos_failed" }, { status: 500 });
  }
}
