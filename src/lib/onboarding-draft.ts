// The onboarding chat draft ("onboarding-chat" localStorage key): one shared
// reader so the onboarding screen, the workspace shell, and the template
// workspace (17) never drift on shape checks. Read-only on purpose — the
// real WorkspaceShell consumes (removes) the draft after login provisioning;
// the template and the onboarding screen must never delete it.
// Plan: docs/plans/icm-workspace-plan/17-template-workspace.md

import type {
  OnboardingProfile,
  OnboardingUIMessage,
} from "@/app/(app)/workspace/start/_lib/onboarding-chat"; // type-only

export const ONBOARDING_DRAFT_KEY = "onboarding-chat";

/** Same light shape check both previous copies used; null on missing/corrupt. */
export function readOnboardingDraft(): OnboardingUIMessage[] | null {
  try {
    const saved = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as OnboardingUIMessage[];
    // Light shape check — ignore drafts from older (mock) formats.
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (!parsed.every((m) => Array.isArray(m?.parts))) return null;
    return parsed;
  } catch {
    // Corrupt or unavailable storage — start fresh.
    return null;
  }
}

/** The completed profile from the latest `data-profile` part, else null. */
export function draftProfile(
  messages: OnboardingUIMessage[],
): OnboardingProfile | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const part = messages[i].parts.find((p) => p.type === "data-profile");
    if (part?.type === "data-profile" && part.data.complete === true) {
      return part.data.profile;
    }
  }
  return null;
}
