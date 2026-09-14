// Provisioning (07, rebuilt): profile answers → a private `UnitEd-Workspace`
// repo in the teacher's own GitHub account, seeded with just 00-Profile/ and
// 01-Start Here/. No template repo, no placeholder pass — later content is
// grown by the workspace agent one numbered micro-step folder at a time.
// Idempotent: double-clicks, refreshes, and retries after a coverage fix
// always return the existing repo, and each seed stage commits independently
// so a mid-flight failure leaves resumable state.

import { NextResponse } from "next/server";
import { RequestError } from "octokit";
import { getSession } from "@/lib/session";
import {
  GitHubRateLimitError,
  WORKSPACE_REPO_NAME,
  checkInstallationCoverage,
  commitMany,
  createWorkspaceRepo,
  findExistingWorkspace,
  getTree,
  writeFile,
} from "@/lib/github";
import { teacherProfileSchema } from "@/lib/onboarding";
import {
  buildProfileFiles,
  buildStartHereFallback,
  detectSeedState,
  generateStartHere,
} from "@/lib/provisioning";
import { getResourcesIndex } from "@/lib/resources";
import { getIcmReference } from "@/lib/public-github";
import {
  FREE_TIER_DAILY_TOKEN_LIMIT,
  addFairUseTokens,
  getFairUse,
} from "@/lib/fair-use";

// Repo creation + public-repo reads + a possible LLM pass + two commits can
// outrun the default function budget on a cold start (99-known-issues #8;
// Vercel Pro).
export const maxDuration = 300;

const PROFILE_COMMIT_MESSAGE = "Add teacher profile from onboarding";
const START_HERE_COMMIT_MESSAGE = "Add your getting-started guide";

/** Replaces the auto_init default readme — short, warm, teacher-facing. */
const README_CONTENT = `# My UnitEd Workspace

This is your private teaching workspace — your files, your data, yours to keep.
Everything here is created with you, and everything is yours to edit.
`;

function repoUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`;
}

export async function POST(req: Request) {
  // 1. Session — the teacher's GitHub account is the user store.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // 2. Validate the onboarding profile.
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
    // 3. Idempotency first (07 step 1): never create a duplicate. The
    // existing repo may still be unseeded if a previous attempt died after
    // creation (coverage fix, network drop) — that is finished below.
    const existing = await findExistingWorkspace(session);
    const target =
      existing ?? (await createWorkspaceRepo(session, WORKSPACE_REPO_NAME));

    // 4. Auth flow should always set this; without it no repo ops are possible.
    if (!session.installationId) {
      return NextResponse.json(
        { error: "app_not_installed" },
        { status: 409 },
      );
    }
    const installationId = session.installationId;

    // 5. "Only select repositories" installs may not cover the new repo (03
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

    // 6. Seed state: which of the two stages already landed. Edge: a repo
    // created outside our flow can be completely empty (no HEAD) — the
    // git-trees API 409s. Treat that as fully unseeded; the first file is
    // then written with writeFile, which works with no HEAD and creates the
    // initial commit that commitMany needs.
    let treePaths: string[];
    let needsInitialCommit = false;
    try {
      const tree = await getTree(installationId, target.owner, target.name);
      treePaths = tree.map((entry) => entry.path);
    } catch (err) {
      if (!(err instanceof RequestError && err.status === 409)) throw err;
      treePaths = [];
      needsInitialCommit = true;
    }
    const seed = detectSeedState(treePaths);

    // 7. 00-Profile/ — deterministic, committed BEFORE any network/LLM work
    // so a later failure still leaves resumable state.
    if (!seed.hasProfile) {
      const files = buildProfileFiles(profile);
      if (needsInitialCommit) {
        const [first, ...rest] = files;
        await writeFile(
          installationId,
          target.owner,
          target.name,
          first.path,
          first.content,
          PROFILE_COMMIT_MESSAGE,
        );
        if (rest.length > 0) {
          await commitMany(
            installationId,
            target.owner,
            target.name,
            rest,
            PROFILE_COMMIT_MESSAGE,
          );
        }
      } else {
        await commitMany(
          installationId,
          target.owner,
          target.name,
          files,
          PROFILE_COMMIT_MESSAGE,
        );
      }
    }

    // 8. 01-Start Here/ — one optional LLM pass behind a fair-use gate, with
    // a full deterministic fallback. Provisioning is NEVER blocked by fair
    // use, an unreachable Resources/ICM repo, or an LLM failure — it degrades.
    if (!seed.hasStartHere) {
      // 8a-b. Neither read ever throws: [] = empty Resources, null = unreachable.
      const resourceIndex = await getResourcesIndex();
      const icm = await getIcmReference();
      const icmExcerpt = icm ? `${icm.skill}\n\n${icm.core}`.slice(0, 3000) : null;

      // 8c. Fair-use gate: the LLM pass spends the NGO's free tier, so skip
      // it once the teacher is over today's ceiling (or no key is set).
      const fu = await getFairUse();
      let files: { path: string; content: string }[];
      let usageTokens = 0;
      if (
        process.env.AI_GATEWAY_API_KEY &&
        fu.tokens < FREE_TIER_DAILY_TOKEN_LIMIT
      ) {
        ({ files, usageTokens } = await generateStartHere(
          profile,
          resourceIndex,
          icmExcerpt,
        ));
      } else {
        files = buildStartHereFallback(profile, resourceIndex);
      }

      // 8d. Meter only real LLM spend (fallback returns usageTokens 0).
      // Legal here — a plain JSON route can still set cookies.
      if (usageTokens > 0) await addFairUseTokens(usageTokens);

      // 8e. One commit: the two Start Here files + our readme replacing the
      // auto_init default.
      await commitMany(
        installationId,
        target.owner,
        target.name,
        [...files, { path: "README.md", content: README_CONTENT }],
        START_HERE_COMMIT_MESSAGE,
      );
    }

    // 9. Done — client redirects to the workspace.
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
