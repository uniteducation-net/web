// The entire "user system": an encrypted httpOnly cookie holding the GitHub
// user identity, user access token + refresh token, app installation id, and
// the connected workspace repo. No database — the user's GitHub repo is state.
// Plan: docs/plans/icm-workspace-plan/02-auth.md

// Server-only module — never import from client components.

import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";

export const SESSION_COOKIE = "session";
/** Short-lived cookie carrying { state, verifier, next } through the OAuth bounce. */
export const OAUTH_STATE_COOKIE = "oauth_state";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionUser = {
  login: string;
  name: string | null;
  avatarUrl: string;
};

export type SessionRepo = {
  owner: string;
  name: string;
};

/** BYOK providers supported in Settings (12 step 2); factories land in 13. */
export type ByokProvider = "openai" | "anthropic" | "google";

export type Session = {
  user: SessionUser;
  userToken: string;
  /** Epoch seconds at which `userToken` expires (GitHub: 8h after issue). */
  userTokenExpiresAt: number;
  refreshToken: string;
  installationId?: number;
  repo?: SessionRepo;
  /** AI provider choice (12/13). Presence activates the provider — resolution
   *  order (openrouterKey → byokKey → gateway free tier) lives in lib/llm.ts.
   *  Keys live ONLY in this encrypted cookie; never logged, never returned to
   *  the client beyond the last 4 characters. */
  byokProvider?: ByokProvider;
  byokKey?: string;
  openrouterKey?: string;
};

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See docs/plans/icm-workspace-plan/01-setup.md.`,
    );
  }
  return value;
}

function sessionKey(): Uint8Array {
  const secret = requireEnv("SESSION_SECRET"); // 32-byte hex (openssl rand -hex 32)
  return new Uint8Array(Buffer.from(secret, "hex"));
}

async function encryptSession(data: Session): Promise<string> {
  return new EncryptJWT({ ...data })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .encrypt(sessionKey());
}

/** Server-only. Returns the decrypted session, or null if absent/invalid/expired. */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtDecrypt(raw, sessionKey());
    const { iat: _iat, exp: _exp, ...data } = payload;
    return data as unknown as Session;
  } catch {
    return null;
  }
}

/** Encrypt and persist the session cookie. Only callable where cookies can be
 *  set (Route Handlers / Server Functions) — not during Server Component render. */
export async function setSession(data: Session): Promise<void> {
  const jwt = await encryptSession(data);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

type RefreshResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
};

/**
 * Returns a valid GitHub user access token, rotating it via the refresh token
 * when it is expired (or within 60s of expiry). GitHub rotates BOTH tokens on
 * refresh — the old refresh token dies on use — so both are persisted before
 * returning. Returns null when the session is gone or the refresh token itself
 * has expired (6 months) → treat as logged out, the user must re-authenticate.
 */
export async function getValidUserToken(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const now = Math.floor(Date.now() / 1000);
  if (session.userTokenExpiresAt - now > 60) return session.userToken;

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: requireEnv("GITHUB_CLIENT_ID"),
      client_secret: requireEnv("GITHUB_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    }),
    cache: "no-store",
  });
  const data = (await res.json()) as RefreshResponse;
  if (!res.ok || !data.access_token || !data.refresh_token) {
    // Refresh token expired or revoked — treat as logged out.
    return null;
  }

  const rotated: Session = {
    ...session,
    userToken: data.access_token,
    userTokenExpiresAt: now + (data.expires_in ?? 28800),
    refreshToken: data.refresh_token,
  };
  await setSession(rotated);
  return data.access_token;
}
