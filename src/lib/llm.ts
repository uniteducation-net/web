// 13 — one entry point decides which model every AI call uses. Onboarding
// (/api/chat) ALWAYS uses the gateway (anonymous users have no keys); the
// workspace agent (/api/agent) resolves per session:
//   openrouterKey → OpenRouter via an OpenAI-compatible factory (the key from
//                   the PKCE flow is billed to the teacher's own account)
//   byokKey       → the chosen provider's factory with their key
//   else          → Vercel AI Gateway free tier ("AI on us")
// Also owns the tiny curated model lists (Settings picker, 13 step 3) and the
// friendly provider-error mapping (13 step 5) — provider error bodies never
// reach the UI.
// Plan: docs/plans/icm-workspace-plan/13-llm-provider.md

import { gateway } from "@ai-sdk/gateway";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import {
  APICallError,
  RetryError,
  StreamProviderError,
  type LanguageModel,
} from "ai";
import type { ByokProvider, Session } from "./session";

/** Cheapest capable Gateway model — same one the onboarding interview uses. */
export const DEFAULT_MODEL = "google/gemini-2.5-flash";

/** Hard output cap on the free tier (13 step 2) — interviews stay cheap. */
export const GATEWAY_MAX_OUTPUT_TOKENS = 2_000;

export type ProviderKind = "openrouter" | "byok" | "gateway";

/**
 * Curated cheap models per provider (13 step 3). The FIRST entry is the
 * default — the cheapest. Resist adding more. Gateway and OpenRouter share
 * the "vendor/model" id shape; BYOK ids are bare per provider.
 */
export const GATEWAY_MODELS = [
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini",
  "anthropic/claude-haiku-4.5",
] as const;
export const OPENROUTER_MODELS = [
  "openai/gpt-4o-mini",
  "google/gemini-2.5-flash",
  "anthropic/claude-haiku-4.5",
] as const;
export const BYOK_MODELS: Record<ByokProvider, readonly string[]> = {
  openai: ["gpt-4o-mini", "gpt-4.1-mini"],
  anthropic: ["claude-haiku-4-5", "claude-sonnet-4-5"],
  google: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
};

/** Which provider a session's agent calls will actually use. */
export function activeProvider(session: Session): ProviderKind {
  if (session.openrouterKey) return "openrouter";
  if (session.byokKey) return "byok";
  return "gateway";
}

/** The curated choices for the session's active provider (Settings picker). */
export function modelOptionsFor(session: Session): readonly string[] {
  const provider = activeProvider(session);
  if (provider === "byok") {
    return BYOK_MODELS[session.byokProvider ?? "openai"];
  }
  return provider === "openrouter" ? OPENROUTER_MODELS : GATEWAY_MODELS;
}

/** The effective model id: the session's choice if still curated, else the
 *  cheapest default for the active provider. */
export function resolveModelId(session: Session): string {
  const options = modelOptionsFor(session);
  return session.model && options.includes(session.model)
    ? session.model
    : options[0];
}

/**
 * Resolve the model for a workspace request. Falls through to the Vercel AI
 * Gateway free tier ("AI on us") when the session carries no keys.
 */
export function resolveModel(session: Session): LanguageModel {
  const modelId = resolveModelId(session);

  if (session.openrouterKey) {
    // OpenRouter speaks the chat-completions API (not Responses) — .chat().
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: session.openrouterKey,
      name: "openrouter",
    });
    return openrouter.chat(modelId);
  }

  if (session.byokKey) {
    switch (session.byokProvider ?? "openai") {
      case "anthropic":
        return createAnthropic({ apiKey: session.byokKey })(modelId);
      case "google":
        return createGoogle({ apiKey: session.byokKey })(modelId);
      default:
        return createOpenAI({ apiKey: session.byokKey })(modelId);
    }
  }

  return gateway(modelId);
}

function statusCodeOf(error: unknown): number | undefined {
  if (APICallError.isInstance(error) || StreamProviderError.isInstance(error)) {
    return error.statusCode;
  }
  if (RetryError.isInstance(error)) return statusCodeOf(error.lastError);
  return undefined;
}

/**
 * 13 step 5 — map provider errors to friendly one-liners. Never leak provider
 * error bodies (they can echo request payloads, key fragments, quota URLs).
 */
export function friendlyProviderError(error: unknown): string {
  const status = statusCodeOf(error);
  if (status === 401 || status === 403) {
    return "Your key seems invalid — update it in Settings.";
  }
  if (status === 429) {
    return "Rate limited — try again in a moment.";
  }
  return "Something went wrong with the AI provider — please try again.";
}
