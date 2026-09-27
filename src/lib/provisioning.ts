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
import { CATEGORY_NAMES, type ProfileEvaluation } from "./evaluation";
import { fetchProviderExcerpt } from "./fetch-provider";
import { getPublicFile, resourcesRepoCoords } from "./public-github";
import { START_HERE_MAIN } from "./workspace-paths";

export { START_HERE_MAIN };

export const PROFILE_DIR = "00-Profile";
export const START_HERE_DIR = "01-Start Here";

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
  hasStep1: boolean;
} {
  return {
    hasProfile: treePaths.some((path) => path === PROFILE_MAIN),
    hasStartHere: treePaths.some((path) => path.startsWith(`${START_HERE_DIR}/`)),
    hasStep1: treePaths.some((path) => /^02-Step 1 - .+\//.test(path)),
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
- **Age group you'll teach:** ${show(profile.ageGroup)}
- **Worked with children before:** ${show(profile.workedWithChildren)}
- **Work or academic background:** ${show(profile.background)}
- **What and where you'll teach:** ${show(profile.teachingWhatWhere)}
- **Study schedule and time commitment:** ${show(profile.schedule)}

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

Curated teaching resources are on the way — when they arrive, the assistant will suggest the ones that fit your classroom and your answers.
`;

  const main = `# Welcome, ${name}!

This is your personal teaching workspace — a private home for your materials, plans, and ideas that grows with you, one step at a time.

## How it works

- **On the left** you'll find your files. Everything the assistant creates for you lives here, and you can open anything to read it.
- **On the right** is your assistant — the same one you just talked to. Ask it to draft a lesson, adapt an activity, or plan your week. It can read these files and write new ones for you.
- **Nothing is set in stone.** Every file is yours to edit, and the assistant adjusts to your changes.

## Your next step

Your first step is already waiting — open \`02-Step 1\` in the file list on the left. It's one resource picked for your answers, with one small thing to try. When you're ready for more, open any step file and press **Open my next step** — the assistant will ask two quick questions and bring you the next one.

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
- Explain the progressive path: their first step already waits in the 02-Step 1 folder (one resource picked for their answers, one small task). Whenever they open a step file and press the "Open my next step" button, the assistant asks two short questions and adds the next numbered step folder. They never need to set anything up in advance.
- If teaching resources are listed in the input, pick the at most 5 most relevant to THIS teacher (age group, background, what and where they teach, schedule) and add a "Resources picked for you" section citing each with a [[Title]] wikilink. If none are listed, add a short note that curated teaching resources are on the way.

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

// ─── NN-Step N (deterministic, no LLM — Jev already decided the category) ──

/** Folder-safe short title from a resource title. */
function stepTitle(title: string): string {
  const clean = title.replace(/[/\\?%*:|"<>]/g, "").replace(/\s+/g, " ").trim();
  return clean.length > 48 ? `${clean.slice(0, 48).trimEnd()}…` : clean;
}

/** Teacher-facing reason line, from how the category was chosen. */
function whyLine(evaluation: ProfileEvaluation): string {
  const name = CATEGORY_NAMES[evaluation.category];
  switch (evaluation.source) {
    case "jev":
      return `Based on your answers, ${name} is the best next step for you.`;
    case "jev-duplicate-avoided":
      return `You've already covered the closest match — so next up is ${name}.`;
    default:
      return `A strong step for every teacher: ${name}.`;
  }
}

/** Strip YAML frontmatter so an embedded native resource reads clean. */
function stripFrontmatter(content: string): string {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

const MAX_NATIVE_EMBED_CHARS = 4000;

/**
 * The "Your resource" section: native resources embed their full body (they
 * are ours and short); links get their summary + URL; providers get a live
 * excerpt fetched at step creation, degrading to the card description +
 * link when the page can't be used (PDF or unreachable — the provider
 * contract's documented path). Source is always attributed.
 */
async function resourceSection(resource: ResourceSummary): Promise<string> {
  if (resource.type === "native") {
    const { owner, repo } = resourcesRepoCoords();
    const content = await getPublicFile(owner, repo, resource.path);
    if (content) {
      const body = stripFrontmatter(content).slice(0, MAX_NATIVE_EMBED_CHARS);
      return `${body}\n\n*From the UnitEd resource library — [[${resource.title}]].*`;
    }
    // Unreachable library → degrade to the summary card.
    return `${resource.summary ?? resource.title}\n\n*From the UnitEd resource library — [[${resource.title}]].*`;
  }

  if (resource.type === "provider" && resource.url) {
    const excerpt = await fetchProviderExcerpt(resource.url);
    if (excerpt.text) {
      return `From [${resource.title}](${resource.url}), this part is for you:\n\n> ${excerpt.text.split("\n").join("\n> ")}\n\n*Source: ${resource.url}*`;
    }
    const note = excerpt.isPdf
      ? "It's a PDF — open it, read the named section, and come back."
      : "Open it online and come back — the link is the step.";
    return `${resource.summary ?? resource.title}\n\nOpen it here: ${resource.url}\n\n*${note}*`;
  }

  // link (or provider without url): summary + URL.
  const parts = [resource.summary ?? resource.title];
  if (resource.url) parts.push(`Open it here: ${resource.url}`);
  return parts.join("\n\n");
}

/**
 * One step folder: a CONTEXT.md contract plus the step file. Deterministic —
 * Jev picked the category, the library provided the resource, and a step
 * must ALWAYS land exactly as promised. The step file's frontmatter
 * (`category:` + `resource:`) is the dedupe record the next-step flow reads.
 */
export async function buildStepFiles(input: {
  stepNumber: number;
  folderNumber: number;
  resource: ResourceSummary;
  evaluation: ProfileEvaluation;
}): Promise<{ path: string; content: string }[]> {
  const { stepNumber, folderNumber, resource, evaluation } = input;
  const title = stepTitle(resource.title);
  const folder = `${String(folderNumber).padStart(2, "0")}-Step ${stepNumber} - ${title}`;

  const task =
    resource.type === "native"
      ? "Work through the resource above, then pick ONE idea to try in your next lesson."
      : "Open the resource, read it once, and pick ONE idea to try in your next lesson.";

  const step = `---
category: ${evaluation.category}
resource: ${resource.path}
---

# Step ${stepNumber} — ${resource.title}

**Why this step:** ${whyLine(evaluation)}

## Your resource

${await resourceSection(resource)}

## Try this

${task} One idea, tried once, is a finished step.

---

*When you've tried it, press **Open my next step** above — I'll ask two quick questions and bring you the next one.*
`;

  const context = `# ${folder} — step contract

**Input:** 00-Profile/ (who this workspace serves) + the UnitEd resource library.

**What this folder is:** one step — one resource, one small task.

**Output:** the teacher tried one idea from the resource.

**Done when:** the teacher pressed "Open my next step" or edited this folder.
`;

  return [
    { path: `${folder}/Step ${stepNumber}.md`, content: step },
    { path: `${folder}/CONTEXT.md`, content: context },
  ];
}
