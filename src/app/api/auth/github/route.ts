// Step 1 of the GitHub App auth chain: start the OAuth web flow.
// Generates CSRF `state` + a PKCE pair, stashes them in a short-lived cookie,
// and redirects to GitHub's authorize screen (which doubles as account signup
// for teachers who don't have GitHub yet). Plan: 02-auth.md step 2.

import { randomBytes, createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE, requireEnv } from "@/lib/session";
const OAUTH_STATE_MAX_AGE = 60 * 30; // 30 min — fresh-account signup + email
// verification easily exceeds 10 min.

const base64url = (buf: Buffer) => buf.toString("base64url");

function sanitizeNext(next: string | null): string {
  // Only allow same-site paths — never an open redirect.
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/workspace";
}

export async function GET(request: NextRequest) {
  let clientId: string;
  let appUrl: string;
  try {
    clientId = requireEnv("GITHUB_CLIENT_ID");
    appUrl = requireEnv("APP_URL");
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const next = sanitizeNext(request.nextUrl.searchParams.get("next"));

  const state = base64url(randomBytes(16));
  const verifier = base64url(randomBytes(32));
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set(
    "redirect_uri",
    `${appUrl}/api/auth/github/callback`,
  );
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  // Explicit: most teachers won't have a GitHub account — the authorize
  // screen doubles as their signup. No `scope` param: GitHub Apps use
  // fine-grained permissions configured on the app itself.
  authorizeUrl.searchParams.set("allow_signup", "true");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({ state, verifier, next }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_STATE_MAX_AGE,
    },
  );
  return response;
}
