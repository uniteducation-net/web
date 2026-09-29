// Provisioning (07, rebuilt): profile answers → a private `UnitEd-Workspace`
// repo in the teacher's own GitHub account, seeded with just 00-Profile/ and
// 01-Start Here/. No template repo, no placeholder pass — later content is
// grown by the workspace agent one numbered micro-step folder at a time.
// Idempotent: double-clicks, refreshes, and retries after a coverage fix
// always return the existing repo, and each seed stage commits independently
// so a mid-flight failure leaves resumable state.
// Template carry-over (17): an optional `files` payload from the anonymous
// template workspace replaces the corresponding seed stages verbatim —
// WYSIWYG conversion, nothing the teacher saw locally is regenerated.

import { NextResponse } from "next/server";
import { RequestError } from "octokit";
import { getSession } from "@/lib/session";
import {
  GitHubRateLimitError,
  GitHubReauthorizationError,
  WORKSPACE_REPO_NAME,
  checkInstallationCoverage,
  commitMany,
  createWorkspaceRepo,
  findExistingWorkspace,
  getAppPermissions,
  getTree,
  writeFile,
} from "@/lib/github";
import { teacherProfileSchema } from "@/lib/onboarding";
import {
  buildProfileFiles,
  buildStartHereFallback,
  buildStepFiles,
  detectSeedState,
  generateStartHere,
} from "@/lib/provisioning";
import { STEP_FILE_PATH } from "@/lib/template-workspace";
import { PROFILE_DIR, START_HERE_DIR, isValidPath } from "@/lib/workspace-paths";
import { getResourcesIndex } from "@/lib/resources";
import { evaluateProfile, pickResource } from "@/lib/evaluation";
import { getIcmReference } from "@/lib/public-github";
import {
  FREE_TIER_DAILY_TOKEN_LIMIT,
  addFairUseTokens,
  getFairUse,
} from "@/lib/fair-use";
import { isBotRequest } from "@/lib/botid";

// Repo creation + public-repo reads + a possible LLM pass + two commits can
// outrun the default function budget on a cold start (99-known-issues #8;
// Vercel Pro).
export const maxDuration = 300;

const PROFILE_COMMIT_MESSAGE = "Add teacher profile from onboarding";
const START_HERE_COMMIT_MESSAGE = "Add your getting-started guide";
const STEP1_COMMIT_MESSAGE = "Add your first step";

const MAX_TEMPLATE_FILES = 60;
const MAX_TEMPLATE_FILE_CHARS = 100_000;
const MAX_TEMPLATE_TOTAL_CHARS = 500_000;

/** Replaces the auto_init default readme — short, warm, teacher-facing. */
const README_CONTENT = `# My UnitEd Workspace

This is your private teaching workspace — your files, your data, yours to keep.
Everything here is created with you, and everything is yours to edit.
`;

function repoUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`;
}

/**
 * Template carry-over validation (17 step 7): allowlisted prefixes only
 * (00-Profile/, 01-Start Here/, NN-Step N - *​/), isValidPath per entry,
 * count/size caps. Returns null on any violation — the client only ever
 * sends its own local draft, so a failure means a hand-crafted payload.
 */
function parseTemplateFiles(
  raw: unknown,
): { path: string; content: string }[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_TEMPLATE_FILES) return null;
  let total = 0;
  for (const entry of raw) {
    if (typeof entry?.path !== "string" || typeof entry?.content !== "string") {
      return null;
    }
    if (!isValidPath(entry.path)) return null;
    const allowed =
      entry.path.startsWith(`${PROFILE_DIR}/`) ||
      entry.path.startsWith(`${START_HERE_DIR}/`) ||
      STEP_FILE_PATH.test(entry.path);
    if (!allowed) return null;
    if (entry.content.length > MAX_TEMPLATE_FILE_CHARS) return null;
    total += entry.content.length;
  }
  if (total > MAX_TEMPLATE_TOTAL_CHARS) return null;
  return raw as { path: string; content: string }[];
}

/** Partition carry-over files by the seed stage they replace. */
function splitTemplateFiles(files: { path: string; content: string }[]) {
  return {
    profile: files.filter((f) => f.path.startsWith(`${PROFILE_DIR}/`)),
    startHere: files.filter((f) => f.path.startsWith(`${START_HERE_DIR}/`)),
    steps: files
      .filter((f) => STEP_FILE_PATH.test(f.path))
      .sort((a, b) => a.path.localeCompare(b.path)),
  };
}

export async function POST(req: Request) {
  // 1. Session — the teacher's GitHub account is the user store.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // BotID after auth (no-op in local dev): unauthenticated traffic never
  // triggers a check.
  if (await isBotRequest()) {
    return NextResponse.json({ error: "access_denied" }, { status: 403 });
  }

  // 2. Validate the onboarding profile + the optional template carry-over.
  let body: { profile?: unknown; files?: unknown };
  try {
    body = (await req.json()) as { profile?: unknown; files?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
  }
  const parsed = teacherProfileSchema.safeParse(body?.profile);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
  }
  const profile = parsed.data;
  let provided: ReturnType<typeof splitTemplateFiles> | null = null;
  if (body.files !== undefined) {
    const files = parseTemplateFiles(body.files);
    if (files === null) {
      return NextResponse.json({ error: "invalid_files" }, { status: 400 });
    }
    provided = splitTemplateFiles(files);
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
    // so a later failure still leaves resumable state. Template carry-over
    // (17) replaces the generated files with the teacher's local draft.
    if (!seed.hasProfile) {
      const files =
        provided && provided.profile.length > 0
          ? provided.profile
          : buildProfileFiles(profile);
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
      let files: { path: string; content: string }[];
      if (provided && provided.startHere.length > 0) {
        // Template carry-over (17): the one-pager the teacher saw (and maybe
        // edited) lands verbatim — the LLM-personalized Start Here is
        // exclusive to the direct onboarding path.
        files = provided.startHere;
      } else {
        // 8a-b. Neither read ever throws: [] = empty Resources, null = unreachable.
        const resourceIndex = await getResourcesIndex();
        const icm = await getIcmReference();
        const icmExcerpt = icm
          ? `${icm.skill}\n\n${icm.core}`.slice(0, 3000)
          : null;

        // 8c. Fair-use gate: the LLM pass spends the NGO's free tier, so skip
        // it once the teacher is over today's ceiling (or no key is set).
        const fu = await getFairUse();
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
      }

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

    // 9. 02-Step 1/ — Jev classifies the profile in the background and the
    // first step lands with the workspace: one resource, one small task.
    // Never blocks provisioning: unreachable library (null/[]) or a failed
    // evaluation simply skips or degrades the stage. Template carry-over
    // (17) commits the step the teacher already saw locally instead.
    if (!seed.hasStep1) {
      if (provided && provided.steps.length > 0) {
        await commitMany(
          installationId,
          target.owner,
          target.name,
          provided.steps,
          STEP1_COMMIT_MESSAGE,
        );
      } else {
        const resourceIndex = await getResourcesIndex();
        if (resourceIndex && resourceIndex.length > 0) {
          const evaluation = await evaluateProfile(profile);
          const resource = pickResource(evaluation, resourceIndex);
          if (resource) {
            const stepFiles = await buildStepFiles({
              stepNumber: 1,
              folderNumber: 2,
              resource,
              evaluation,
            });
            await commitMany(
              installationId,
              target.owner,
              target.name,
              stepFiles,
              STEP1_COMMIT_MESSAGE,
            );
            // Meter the (tiny) Jev spend like the Start Here LLM pass.
            if (evaluation.usageTokens > 0) {
              await addFairUseTokens(evaluation.usageTokens);
            }
          }
        }
      }
    }

    // 10. Done — client redirects to the workspace.
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
    // The teacher's user token predates a permission grant (99-known-issues
    // #11) — only re-authorization fixes it, so say so explicitly.
    if (err instanceof GitHubReauthorizationError) {
      // Diagnostics for 99 #11: the registration's configured permissions.
      // Compare with the 403 log in createWorkspaceRepo — if repository_creation
      // isn't "write" HERE, no token can ever work (dashboard step pending).
      try {
        console.warn(
          "[workspace/create] app registration permissions:",
          await getAppPermissions(),
        );
      } catch {
        // Diagnostics must never mask the real error.
      }
      return NextResponse.json(
        { error: "github_reauthorization_needed" },
        { status: 403 },
      );
    }
    // 451 (trade controls) is new in API version 2026-03-10 — say it plainly.
    if (err instanceof RequestError && err.status === 451) {
      return NextResponse.json(
        { error: "github_region_blocked" },
        { status: 451 },
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
