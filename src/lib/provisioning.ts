// Seed content for a brand-new workspace: 00-Profile/ (the onboarding
// answers, deterministic — never an LLM) and 01-Start Here/ (one optional LLM
// pass with a complete deterministic fallback for every failure mode).
// detectSeedState replaces the old `{{`-placeholder gate as the create
// route's idempotency check. Later content is NOT seeded — the workspace
// agent grows the repo one numbered micro-step folder at a time.
// Plan: docs/plans/icm-workspace-plan/00-overview.md (final adjustments, step 3)

// Server-only module — never import from client components.

import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import type { TeacherProfile } from "./onboarding";
import type { ResourceSummary } from "./resources";

export const PROFILE_DIR = "00-Profile";
export const START_HERE_DIR = "01-Start Here";
export const START_HERE_MAIN = "01-Start Here/Start Here.md";

const PROFILE_CONTEXT = `${PROFILE_DIR}/CONTEXT.md`;
const PROFILE_MAIN = `${PROFILE_DIR}/profile.md`;
const START_HERE_CONTEXT = `${START_HERE_DIR}/CONTEXT.md`;

const NOT_SHARED = "Not shared during onboarding";

/**
 * Idempotency check for provisioning: which seed stages already exist in the
 * repo. hasProfile keys on the profile record itself; hasStartHere on
 * anything under the folder (a teacher may have edited the main file).
 */
export function detectSeedState(treePaths: string[]): {
  hasProfile: boolean;
  hasStartHere: boolean;
} {
  return {
    hasProfile: treePaths.some((path) => path === PROFILE_MAIN),
    hasStartHere: treePaths.some((path) => path.startsWith(`${START_HERE_DIR}/`)),
  };
}

// ─── 00-Profile (deterministic, no LLM) ──────────────────────────────────

/**
 * The permanent record of who this workspace serves. Committed FIRST so a
 * later failure still leaves resumable state. Plain, warm, teacher-facing —
 * never mention ICM, GitHub, or templates.
 */
export function buildProfileFiles(
  profile: TeacherProfile,
): { path: string; content: string }[] {
  const show = (value: string | null): string => value ?? NOT_SHARED;

  const context = `# ${PROFILE_DIR} — folder contract

**What this folder is:** the permanent record of who this workspace serves.

**Who reads it:** every later stage reads this folder first, before drafting anything.

**Who writes it:** you — edit profile.md whenever an answer is missing, wrong, or out of date. Everything else in this workspace follows what it says here.
`;

  const main = `# About ${profile.name ?? "you"}

This is what you shared when your workspace was set up. Everything your assistant creates for you starts from these answers.

- **Name:** ${show(profile.name)}
- **Subject:** ${show(profile.subject)}
- **Grade level:** ${show(profile.gradeLevel)}
- **Teaching context:** ${show(profile.teachingContext)}
- **Preferred tone:** ${show(profile.tone)}
- **Goals for this year:** ${show(profile.goals)}

If any of this changes, just edit this file — your assistant reads it before every new piece of work.
`;

  return [
    { path: PROFILE_CONTEXT, content: context },
    { path: PROFILE_MAIN, content: main },
  ];
}

// ─── 01-Start Here: deterministic fallback ───────────────────────────────

/** Bullet for one matched resource: wikilink mention + relative link. */
function resourceBullet(resource: ResourceSummary): string {
  const link = `[${resource.path}](<../${resource.path}>)`;
  return resource.summary
    ? `- [[${resource.title}]] — ${resource.summary} (${link})`
    : `- [[${resource.title}]] (${link})`;
}

/**
 * The getting-started guide, built without any LLM. Used directly when the
 * Gateway key is missing, and as the fallback for every generateStartHere
 * failure mode — a new workspace must ALWAYS land these two files.
 */
export function buildStartHereFallback(
  profile: TeacherProfile,
  resourceIndex: ResourceSummary[] | null,
): { path: string; content: string }[] {
  const name = profile.name ?? "Teacher";

  const resourcesSection =
    resourceIndex && resourceIndex.length > 0
      ? `## Resources picked for you

These come from a small curated collection for teachers. Ask the assistant to walk you through any of them, or to build your next step on top of one.

${resourceIndex.map(resourceBullet).join("\n")}
`
      : `## Resources on the way

Curated teaching resources are on the way — when they arrive, the assistant will suggest the ones that fit your subject and grade level.
`;

  const main = `# Welcome, ${name}!

This is your personal teaching workspace — a private home for your materials, plans, and ideas that grows with you, one step at a time.

## How it works

- **On the left** you'll find your files. Everything the assistant creates for you lives here, and you can open anything to read it.
- **On the right** is your assistant — the same one you just talked to. Ask it to draft a lesson, adapt an activity, or plan your week. It can read these files and write new ones for you.
- **Nothing is set in stone.** Every file is yours to edit, and the assistant adjusts to your changes.

## Your next step

You don't need to set anything up. Whenever you're ready, just ask the assistant for your next step — it will appear here as a new numbered folder (like \`02-Step 1 - ...\`), each folder doing one clear job and building on the last. Ask for one step at a time, and only when you need it.

${resourcesSection}`;

  const context = `# ${START_HERE_DIR} — stage contract

**Input:** ${PROFILE_DIR}/ — who this workspace serves.

**What this folder is:** the orientation the teacher reads first.

**Output:** the teacher knows their next move — ask the assistant for it, and it arrives as a new numbered step folder.

**Done when:** the teacher has asked for (or decided against) their first step.
`;

  return [
    { path: START_HERE_MAIN, content: main },
    { path: START_HERE_CONTEXT, content: context },
  ];
}

// ─── 01-Start Here: one optional LLM pass ────────────────────────────────

/** Used when the live method reference can't be read — three lines is all
 *  the model needs to keep the folder conventions straight. */
const FALLBACK_CONVENTIONS = `One folder, one job — never mix concerns.
Every folder carries a CONTEXT.md stating its inputs, process, and output.
Numbered folders show the order of work; never pre-create future steps.`;

const START_HERE_SYSTEM_PROMPT = `You write the two starting files for a teacher's brand-new personal teaching workspace, using the profile they gave during onboarding.

Return ONLY a JSON array of exactly two objects, in this order, with exactly these paths:
[{"path":"${START_HERE_MAIN}","content":"…"},{"path":"${START_HERE_CONTEXT}","content":"…"}]
No markdown fences, no commentary.

"Start Here.md" must:
- Open with a warm welcome addressed to the teacher by name (fall back to "Teacher").
- Explain in plain language what this workspace is: a private home for their teaching materials that grows one step at a time.
- Explain the chat panel on the right: the same assistant from onboarding; it can read these files and write new ones.
- Explain the progressive path: whenever they ask the assistant for their next step, it appears as a new numbered folder (02-Step 1 - …), one clear job per folder. They never need to set anything up in advance.
- If teaching resources are listed in the input, pick the at most 5 most relevant to THIS teacher (subject, grade level, goals) and add a "Resources picked for you" section citing each with a [[Title]] wikilink. If none are listed, add a short note that curated teaching resources are on the way.

"CONTEXT.md" must be a short stage contract for the folder: input = 00-Profile/ (who this workspace serves); output = the teacher knows their next move.

Follow the workspace conventions provided in the input. Write in warm, plain, teacher-facing language. Never mention "ICM", GitHub, repositories, or templates.`;

const startHereFilesSchema = z.array(
  z.object({ path: z.string().min(1), content: z.string() }),
);

const EXPECTED_PATHS = [START_HERE_MAIN, START_HERE_CONTEXT] as const;

/**
 * One generateText call produces both Start Here files (resource matching is
 * folded into the prompt — the model picks and cites the ≤5 most relevant).
 * EVERY failure mode — missing Gateway key, a thrown call, unparseable
 * output, or a path set that isn't exactly the two expected files — returns
 * the deterministic fallback with usageTokens 0.
 */
export async function generateStartHere(
  profile: TeacherProfile,
  resourceIndex: ResourceSummary[] | null,
  icmExcerpt: string | null,
): Promise<{ files: { path: string; content: string }[]; usageTokens: number }> {
  const fallback = () => ({
    files: buildStartHereFallback(profile, resourceIndex),
    usageTokens: 0,
  });

  if (!process.env.AI_GATEWAY_API_KEY) return fallback();

  const resourcesBlock =
    resourceIndex && resourceIndex.length > 0
      ? resourceIndex
          .map(
            (resource) =>
              `- ${resource.title}${resource.summary ? ` — ${resource.summary}` : ""}`,
          )
          .join("\n")
      : "(none available)";

  let text: string;
  let usageTokens = 0;
  try {
    const result = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: START_HERE_SYSTEM_PROMPT,
      prompt: `Teacher profile (JSON):\n${JSON.stringify(profile, null, 2)}\n\nWorkspace conventions:\n${icmExcerpt ?? FALLBACK_CONVENTIONS}\n\nAvailable teaching resources (title — summary):\n${resourcesBlock}`,
      maxOutputTokens: 2000,
    });
    text = result.text;
    usageTokens = result.usage.totalTokens ?? 0;
  } catch {
    return fallback();
  }

  // Tolerate a ```json fence despite the prompt; take the outermost array.
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) return fallback();

  let json: unknown;
  try {
    json = JSON.parse(text.slice(start, end + 1));
  } catch {
    return fallback();
  }
  const parsed = startHereFilesSchema.safeParse(json);
  if (!parsed.success) return fallback();

  // The model must return exactly the two expected paths — anything else
  // means it invented structure we can't trust.
  const byPath = new Map(parsed.data.map((file) => [file.path, file.content]));
  if (
    byPath.size !== EXPECTED_PATHS.length ||
    EXPECTED_PATHS.some((path) => !byPath.has(path))
  ) {
    return fallback();
  }

  return {
    files: EXPECTED_PATHS.map((path) => ({
      path,
      content: byPath.get(path)!,
    })),
    usageTokens,
  };
}
