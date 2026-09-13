import type { UIMessage } from "ai";

/**
 * Profile fields the interviewer collects conversationally.
 * 06 owns the canonical zod schema + extraction in src/lib/onboarding.ts;
 * 07 tolerates `null` for fields a cut-off conversation never collected.
 */
export interface OnboardingProfile {
  name: string | null;
  subject: string | null;
  gradeLevel: string | null;
  teachingContext: string | null;
  tone: string | null;
  goals: string | null;
}

/**
 * Readiness signal emitted by /api/chat as a `data-profile` UIMessage data
 * part when the interviewer is done (05 step 5, 06 step 4).
 */
export interface ProfileSignal {
  complete: boolean;
  profile: OnboardingProfile;
}

export type OnboardingUIMessage = UIMessage<
  unknown,
  { profile: ProfileSignal }
>;

/** Seeded first message so the screen never looks empty (05 step 2). */
export const OPENING_MESSAGE: OnboardingUIMessage = {
  id: "opening",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hi! I'm going to build your personal teaching workspace. Three quick questions — first, what do you teach, and to whom?",
    },
  ],
};
