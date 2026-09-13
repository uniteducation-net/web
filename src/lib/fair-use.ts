// 12 step 6 — fair-use accounting for the "AI on us" gateway free tier: a
// signed httpOnly cookie `fu` holding { date, tokens }, reset daily (UTC).
// Crude but database-free — and honest about it ("resets daily" is shown in
// the Settings UI). 13 enforces the ceiling in /api/agent; this module only
// owns the counter. Signed with HS256 (jose, same SESSION_SECRET as the
// session cookie) so the count can't be edited client-side — only reset by
// deleting the cookie, which is fine: the ceiling is a kindness, not a wall.
// Plan: docs/plans/icm-workspace-plan/12-settings.md

// Server-only module — never import from client components.

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { requireEnv } from "./session";

export const FAIR_USE_COOKIE = "fu";
/** Daily token ceiling for the gateway free tier (13 step 2 enforces it). */
export const FREE_TIER_DAILY_TOKEN_LIMIT = 200_000;

export type FairUse = {
  /** UTC day, YYYY-MM-DD. */
  date: string;
  tokens: number;
};

function fairUseKey(): Uint8Array {
  return new Uint8Array(Buffer.from(requireEnv("SESSION_SECRET"), "hex"));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Current counter; a missing/invalid/stale cookie reads as a fresh day. */
export async function getFairUse(): Promise<FairUse> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(FAIR_USE_COOKIE)?.value;
  if (!raw) return { date: today(), tokens: 0 };
  try {
    const { payload } = await jwtVerify(raw, fairUseKey());
    const date = typeof payload.date === "string" ? payload.date : today();
    const tokens =
      typeof payload.tokens === "number" && payload.tokens > 0
        ? Math.floor(payload.tokens)
        : 0;
    if (date !== today()) return { date: today(), tokens: 0 };
    return { date, tokens };
  } catch {
    return { date: today(), tokens: 0 };
  }
}

async function setFairUse(value: FairUse): Promise<void> {
  const jwt = await new SignJWT({ ...value })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("3d") // outlives the day boundary; stale dates reset anyway
    .sign(fairUseKey());
  const cookieStore = await cookies();
  cookieStore.set(FAIR_USE_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 3,
  });
}

/**
 * Add tokens to today's counter and persist. Only callable where cookies can
 * be set (Route Handlers / Server Functions) — which is why the agent route
 * (streaming, headers already sent) reports usage to the client and the
 * client posts it to /api/settings instead (12 step 6).
 */
export async function addFairUseTokens(tokens: number): Promise<FairUse> {
  const current = await getFairUse();
  const next: FairUse = {
    date: today(),
    tokens: current.tokens + Math.max(0, Math.floor(tokens)),
  };
  await setFairUse(next);
  return next;
}
