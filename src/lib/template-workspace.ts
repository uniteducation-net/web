// Shared deterministic workspace content — the PURE half of provisioning
// (lib/provisioning.ts keeps the LLM passes + the step builder, both
// server-only). The anonymous template workspace (17) builds its local draft
// from the exact same functions the create route seeds repos with, so what a
// teacher previews locally is byte-identical to what lands in their repo.
// Kept dependency-free like workspace-paths.ts: the template shell is a
// client component, and pulling the provisioning chain into the client
// bundle would break the build.
// Plan: docs/plans/icm-workspace-plan/17-template-workspace.md

import type { TeacherProfile } from "./onboarding"; // type-only — erased at build time
import {
  PROFILE_CONTEXT,
  PROFILE_MAIN,
  START_HERE_CONTEXT,
  START_HERE_MAIN,
} from "./workspace-paths";

export const NOT_SHARED = "Not shared during onboarding";

/** Tree-only placeholder for the not-yet-generated first step (17 step 2).
 *  Never a real file path — replaced by the generated "02-Step 1 - <title>".
 *  Deliberately title-cased teacher-facing English. */
export const STEP1_PLACEHOLDER_DIR = "02-Step 1 - Your first step";

/** Matches a real generated step file path (NN-Step N - <title>/…). */
export const STEP_FILE_PATH = /^\d{2}-Step \d+ - .+\//;

export const EMPTY_TEMPLATE_PROFILE: TeacherProfile = {
  name: null,
  ageGroup: null,
  workedWithChildren: null,
  background: null,
  teachingWhatWhere: null,
  schedule: null,
};

/**
 * "Enough data" gate for the anonymous step-1 generation (17 step 4): a name
 * plus at least two other answers — below that, a "personalized" step is a
 * coin flip, so the template keeps its empty step folder instead.
 */
export function hasEnoughProfileData(profile: TeacherProfile): boolean {
  const others = [
    profile.ageGroup,
    profile.workedWithChildren,
    profile.background,
    profile.teachingWhatWhere,
    profile.schedule,
  ].filter((value) => value !== null).length;
  return profile.name !== null && others >= 2;
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

  const context = `# 00-Profile — folder contract

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

// ─── 01-Start Here: shared contract + the template one-pager ─────────────

/** The 01-Start Here CONTEXT.md stage contract — shared by the provisioning
 *  fallback (lib/provisioning.ts) and the template one-pager. */
export function buildStartHereContextContract(): string {
  return `# 01-Start Here — stage contract

**Input:** 00-Profile/ — who this workspace serves.

**What this folder is:** the orientation the teacher reads first.

**Output:** the teacher knows their next move — ask the assistant for it, and it arrives as a new numbered step folder.

**Done when:** the teacher has asked for (or decided against) their first step.
`;
}

/**
 * The template workspace's minimal static one-pager (17 step 2) — NOT
 * provisioning's buildStartHereFallback: that one promises "your first step
 * is already waiting in 02-Step 1" (wrong for an empty template) and carries
 * a resources section. This one explains the system as it stands in draft
 * mode: local-only, login unlocks the assistant that builds the steps.
 */
export function buildTemplateStartHereFiles(
  profile: TeacherProfile | null,
): { path: string; content: string }[] {
  const name = profile?.name ?? "Teacher";

  const main = `# Welcome, ${name}!

This is your personal teaching workspace — a home for your materials, plans, and ideas. You're looking at a draft: it lives only in this browser until you log in and save it as your own.

## How it works

- **On the left** are your files. Open anything to read it, and edit freely — everything here is yours to change.
- **Your workspace grows one step at a time.** After you log in, your assistant builds numbered step folders for you — one at a time, each with one resource picked for your answers and one small thing to try.
- **Nothing is set in stone.** Every file is editable, and your assistant adjusts to your changes.

## Your next step

Your first step lands in the \`02-Step 1\` folder on the left. Log in above to keep this workspace and meet your assistant.
`;

  return [
    { path: START_HERE_MAIN, content: main },
    { path: START_HERE_CONTEXT, content: buildStartHereContextContract() },
  ];
}

/** The deterministic template seed: profile files (answers or "Not shared…"
 *  placeholders) + the template Start Here. Step 1 is deliberately absent —
 *  the tree shows it as an empty placeholder folder until generated. */
export function buildTemplateFiles(
  profile: TeacherProfile | null,
): { path: string; content: string }[] {
  return [
    ...buildProfileFiles(profile ?? EMPTY_TEMPLATE_PROFILE),
    ...buildTemplateStartHereFiles(profile),
  ];
}
