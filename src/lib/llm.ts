// One entry point decides which model every AI call uses. 11 needs it now;
// 13 extends this with per-session BYOK and OpenRouter OAuth resolution.
// Plan: docs/plans/icm-workspace-plan/13-llm-provider.md

import { gateway } from "@ai-sdk/gateway";
import type { LanguageModel } from "ai";
import type { Session } from "./session";

/** Cheapest capable Gateway model — same one the onboarding interview uses. */
export const DEFAULT_MODEL = "google/gemini-2.5-flash";

/**
 * Resolve the model for a workspace request. Today every session falls
 * through to the Vercel AI Gateway free tier ("AI on us").
 * TODO(13-llm-provider): resolve session.openrouterKey / session.byokKey
 * first, and enforce the free-tier token ceiling on the gateway path.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- session drives BYOK/OpenRouter resolution in 13
export function resolveModel(_session: Session): LanguageModel {
  return gateway(DEFAULT_MODEL);
}
