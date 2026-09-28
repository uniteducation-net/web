// Jev profile evaluation (16): one experimental_evaluate call through the AI
// Gateway decides which content category a teacher's next step comes from.
// Jev is an evaluation model — it never writes text. It answers typed
// questions (choice / score / boolean) against the profile as shared state,
// and plain code combines the answers into a decision. The chat model writes
// everything the teacher reads.
// Spec: Resources repo → 10-logics/30_matching/02_jev-evaluation.md
// Categories: Resources repo → 10-logics/20_content-framework/

// Server-only module — never import from client components.

import { experimental_evaluate } from "ai";
import { gateway } from "@ai-sdk/gateway";
import type { TeacherProfile } from "./onboarding";
import type { ResourceSummary } from "./resources";

export const CATEGORIES = ["1.1", "1.2", "1.3", "2.1", "2.2", "3.1", "3.2"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Display names for step files and chat. Source of truth is the Resources
 *  repo's 20_content-framework/ — rename there means rename here. */
export const CATEGORY_NAMES: Record<Category, string> = {
  "1.1": "Teaching & Learning Fundamentals",
  "1.2": "Teacher Presence & Communication",
  "1.3": "Classroom Management",
  "2.1": "Inclusive Teaching",
  "2.2": "Context-Responsive Teaching",
  "3.1": "Ethics & Safeguarding",
  "3.2": "Teacher Growth & Wellbeing",
};

/**
 * Fallback order when Jev is unavailable or unsure: the Topic Relevance
 * Matrix's MVP priority — foundations first, mandatory safeguarding early,
 * supportive content later.
 */
const FALLBACK_ORDER: Category[] = ["1.1", "1.3", "1.2", "3.1", "2.1", "2.2", "3.2"];

/** Below this computed confidence the choice answer is not trusted (spec:
 *  "Act on primary_need only when confidence ≥ 0.6"). */
const CONFIDENCE_FLOOR = 0.6;

export interface ProfileEvaluation {
  category: Category;
  /** How the category was chosen — feeds the step file's why-line. */
  source: "jev" | "jev-low-confidence" | "jev-duplicate-avoided" | "fallback";
  /** Computed confidence of the primary_need choice, null when unknown. */
  confidence: number | null;
  usageTokens: number;
}

/**
 * The AI SDK normalizes Jev's answers to choice + probabilities without the
 * raw API's confidence field, so compute it from the distribution's shape —
 * the same peak formula the TypeSafe docs demo: (n × peak − 1) / (n − 1),
 * clamped to [0, 1]. Unknown distribution → null (treated as low confidence).
 */
function choiceConfidence(probabilities: Record<string, number> | undefined): number | null {
  if (!probabilities) return null;
  const values = Object.values(probabilities);
  const n = values.length;
  if (n < 2) return null;
  const peak = Math.max(...values);
  return Math.min(1, Math.max(0, (n * peak - 1) / (n - 1)));
}

/** The profile as Jev's shared state — the five answers, verbatim. */
function profileState(profile: TeacherProfile): Record<string, string> {
  const show = (value: string | null) => value ?? "not shared";
  return {
    ageGroup: show(profile.ageGroup),
    workedWithChildren: show(profile.workedWithChildren),
    background: show(profile.background),
    teachingWhatWhere: show(profile.teachingWhatWhere),
    schedule: show(profile.schedule),
  };
}

const CATEGORY_CRITERIA: Record<Category, string> = {
  "1.1": "Foundations: how learning works, lesson planning, active learning, assessment & feedback, motivation",
  "1.2": "Communication: clear instructions, explaining & modelling, questioning, facilitating discussions, teacher–learner relationships",
  "1.3": "Classroom management: routines & procedures, expectations, positive behaviour management, transitions, group work, engagement",
  "2.1": "Inclusive teaching: differentiation, multilingual classrooms, mixed-age groups, additional learning needs, UDL",
  "2.2": "Context-responsive teaching: low-resource teaching, large classes, culturally responsive teaching, community & family engagement",
  "3.1": "Ethics & safeguarding: child protection, professional boundaries, recognising concerns, reporting & responding",
  "3.2": "Teacher growth & wellbeing: reflective practice, self-evaluation, peer support, confidence, resilience, isolation",
};

/**
 * The matrix-priority fallback as a standalone export — for callers that
 * must skip the LLM even when a gateway key exists (the anonymous
 * template-step route over the fair-use ceiling, 17 step 4).
 */
export function fallbackEvaluation(
  doneCategories: string[] = [],
): ProfileEvaluation {
  const done = new Set(doneCategories);
  const category =
    FALLBACK_ORDER.find((c) => !done.has(c)) ?? FALLBACK_ORDER[0];
  return { category, source: "fallback", confidence: null, usageTokens: 0 };
}

/**
 * Evaluate a state (the onboarding answers, or the growing profile text plus
 * the latest reflection) with Jev and pick the category of the next step.
 * Never throws and never blocks: every failure mode degrades to the
 * matrix-priority fallback order, skipping categories in `doneCategories`.
 */
export async function evaluateState(
  state: Record<string, string> | string,
  doneCategories: string[] = [],
): Promise<ProfileEvaluation> {
  const done = new Set(doneCategories);

  const fallback = (usageTokens = 0): ProfileEvaluation => ({
    ...fallbackEvaluation(doneCategories),
    usageTokens,
  });

  if (!process.env.AI_GATEWAY_API_KEY) return fallback();

  let answers;
  let usageTokens = 0;
  try {
    const result = await experimental_evaluate({
      model: gateway.evaluation("typesafe-ai/jev"),
      state,
      questions: {
        primary_need: {
          type: "choice",
          instructions:
            "Which single content category should this emerging educator start with — the one whose content helps their situation most right now?",
          criteria: { ...CATEGORY_CRITERIA, none: "No category fits these answers" },
        },
        worked_with_children: {
          type: "boolean",
          instructions: "Has this person worked with children before?",
        },
        entry_depth: {
          type: "score",
          instructions: "What entry depth fits this educator's experience?",
          criteria: [
            "First-time educator",
            "Some informal teaching",
            "Experienced but untrained",
          ],
        },
        low_resource_context: {
          type: "boolean",
          instructions:
            "Does the teaching context suggest limited materials or connectivity?",
        },
        large_classes: {
          type: "boolean",
          instructions:
            "Does the context suggest large or overcrowded classes?",
        },
      },
    });
    answers = result.answers;
    usageTokens = result.usage.totalTokens ?? 0;
  } catch {
    return fallback();
  }

  const primary = answers.primary_need;
  const confidence = choiceConfidence(primary.probabilities);
  const confident = confidence !== null && confidence >= CONFIDENCE_FLOOR;

  let category: Category | null =
    confident && primary.choice !== "none" ? primary.choice : null;
  let source: ProfileEvaluation["source"] = category ? "jev" : "jev-low-confidence";

  // 3.1 Ethics & Safeguarding is mandatory early (the matrix marks it
  // non-optional): from the second step on, an unsure Jev defers to it.
  if (
    !category &&
    done.size >= 1 &&
    !done.has("3.1") &&
    FALLBACK_ORDER.slice(0, done.size + 1).every((c) => c !== "3.1" || done.has(c))
  ) {
    category = "3.1";
    source = "jev-low-confidence";
  }

  // Never repeat a done category: walk Jev's own probability ranking first,
  // then the matrix-priority order.
  if (category && done.has(category)) {
    source = "jev-duplicate-avoided";
    const ranked = Object.entries(primary.probabilities ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);
    category =
      (ranked.find((key): key is Category =>
        (CATEGORIES as readonly string[]).includes(key) && !done.has(key),
      ) ?? null) ||
      FALLBACK_ORDER.find((c) => !done.has(c)) ||
      FALLBACK_ORDER[0];
  }

  if (!category) {
    category = FALLBACK_ORDER.find((c) => !done.has(c)) ?? FALLBACK_ORDER[0];
  }

  return { category, source, confidence, usageTokens };
}

/** Provisioning's entry point: the five onboarding answers as the state. */
export function evaluateProfile(
  profile: TeacherProfile,
  doneCategories: string[] = [],
): Promise<ProfileEvaluation> {
  return evaluateState(profileState(profile), doneCategories);
}

/**
 * The one resource a step is built on: in the chosen category, never in
 * `excludePaths` (the dedupe record — step files carry `resource:` paths).
 * Preference: our own native resources first, then links, then providers.
 */
export function pickResourceForCategory(
  category: Category,
  index: ResourceSummary[],
  excludePaths: string[] = [],
): ResourceSummary | null {
  const excluded = new Set(excludePaths);
  const candidates = index.filter(
    (resource) => resource.category === category && !excluded.has(resource.path),
  );
  const preference = (type: string | null) =>
    type === "native" ? 0 : type === "link" ? 1 : 2;
  return candidates.sort((a, b) => preference(a.type) - preference(b.type))[0] ?? null;
}

/**
 * Pick one resource for an evaluation: the chosen category first, then the
 * matrix-priority order — so a category with no servable resource yet never
 * blocks the step.
 */
export function pickResource(
  evaluation: ProfileEvaluation,
  index: ResourceSummary[],
  excludePaths: string[] = [],
): ResourceSummary | null {
  const ordered = [
    evaluation.category,
    ...FALLBACK_ORDER.filter((c) => c !== evaluation.category),
  ];
  for (const category of ordered) {
    const resource = pickResourceForCategory(category, index, excludePaths);
    if (resource) return resource;
  }
  return null;
}
