// Provisioning (07): profile answers → a private, personalized
// `united-workspace` repo in the teacher's own GitHub account.
// Idempotent: double-clicks, refreshes, and retries after a coverage fix
// always return the existing repo instead of creating a duplicate.

import { NextResponse } from "next/server";
import { RequestError } from "octokit";
import { getSession } from "@/lib/session";
import {
  GitHubRateLimitError,
  WORKSPACE_REPO_NAME,
  checkInstallationCoverage,
  commitMany,
  createWorkspaceFromTemplate,
  findExistingWorkspace,
  getTree,
  readFile,
} from "@/lib/github";
import { personalizeWorkspaceFiles, teacherProfileSchema } from "@/lib/onboarding";

// Template copy + batched LLM personalization + a commit can outrun the
// default function budget on a cold start (99-known-issues #8; Vercel Pro).
export const maxDuration = 300;

const COMMIT_MESSAGE = "Personalize workspace from onboarding";

function repoUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let profile;
  try {
    const body = (await req.json()) as { profile?: unknown };
    const parsed = teacherProfileSchema.safeParse(body?.profile);
    if (!parsed.success) throw new Error("invalid profile");
    profile = parsed.data;
  } catch {
    return NextResponse.json(
      { error: "invalid_profile" },
      { status: 400 },
    );
  }

  try {
    // Idempotency first (07 step 1): never create a duplicate. Note the
    // existing repo may still be un-personalized if a previous attempt died
    // after creation (coverage fix, network drop) — that is finished below.
    const existing = await findExistingWorkspace(session);
    const target =
      existing ?? (await createWorkspaceFromTemplate(session, WORKSPACE_REPO_NAME));

    if (!session.installationId) {
      // Auth flow should always set this; without it no repo ops are possible.
      return NextResponse.json(
        { error: "app_not_installed" },
        { status: 409 },
      );
    }
    const installationId = session.installationId;

    // "Only select repositories" installs may not cover the new repo (03
    // step 8): hand the teacher a one-click fix link and let them retry.
    const coverage = await checkInstallationCoverage(
      installationId,
      target.owner,
      target.name,
    );
    if (!coverage.covered) {
      return NextResponse.json(
        { error: "installation_not_covering_repo", fixUrl: coverage.fixUrl },
        { status: 409 },
      );
    }

    // Template contents (07 step 2): every .md file in the new repo, read
    // with the installation token.
    const tree = await getTree(installationId, target.owner, target.name);
    const mdPaths = tree
      .map((entry) => entry.path)
      .filter((path) => path.toLowerCase().endsWith(".md"));
    const files = await Promise.all(
      mdPaths.map(async (path) => ({
        path,
        content: (await readFile(installationId, target.owner, target.name, path))
          .content,
      })),
    );

    // Skip the LLM pass entirely when nothing needs personalizing (idempotent
    // re-POSTs after a successful create land here).
    if (files.some((file) => file.content.includes("{{"))) {
      const personalized = await personalizeWorkspaceFiles(profile, files);
      const changed = personalized.filter(
        (file, i) => file.content !== files[i].content,
      );
      if (changed.length > 0) {
        // ONE bot commit for the whole personalization (07 step 4).
        await commitMany(
          installationId,
          target.owner,
          target.name,
          changed,
          COMMIT_MESSAGE,
        );
      }
    }

    return NextResponse.json({
      owner: target.owner,
      repo: target.name,
      url: repoUrl(target.owner, target.name),
    });
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
    console.error("workspace create failed:", err);
    return NextResponse.json(
      { error: "workspace_create_failed" },
      { status: 500 },
    );
  }
}
