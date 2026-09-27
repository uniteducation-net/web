// Vercel BotID server-side check, single import point for route handlers
// (docs: vercel.com/docs/botid/get-started). Only routes listed in
// src/instrumentation-client.ts carry the challenge headers — adding a
// protected route requires updating both files.
//
// Returns true when the request must be blocked. Bypassed entirely outside
// production (local dev) or when BOTID_DISABLED=1 (preview/e2e kill-switch —
// unset by default, set per-environment in Vercel only if needed).

import { checkBotId } from "botid/server";

export async function isBotRequest(): Promise<boolean> {
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.BOTID_DISABLED === "1"
  ) {
    return false;
  }
  return (await checkBotId()).isBot;
}
