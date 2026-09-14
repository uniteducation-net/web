// Step 2 of the GitHub App auth chain: OAuth callback.
// Verifies `state`, exchanges the code (with PKCE verifier) for a user access
// token + refresh token, fetches the user's identity and installations, writes
// the encrypted session cookie, then either continues to `next` (app already
// installed) or bounces the user to the app's install screen. Plan: 02-auth.md
// step 3. IMPORTANT: no repo is created here — that happens in 07.

import { NextRequest, NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  requireEnv,
  sanitizeNext,
  setSession,
  unsealOAuthState,
} from "@/lib/session";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

type GitHubUser = { login: string; name: string | null; avatar_url: string };

type InstallationsResponse = {
  installations: { id: number; account: { login: string } | null }[];
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) return badRequest("Missing code or state.");

  const rawState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!rawState) return badRequest("Missing oauth_state cookie.");
  // The cookie is signed (02 step 2) — a forged or expired one never parses.
  const oauthState = await unsealOAuthState(rawState);
  if (!oauthState) return badRequest("Corrupt oauth_state cookie.");
  if (oauthState.state !== state) return badRequest("State mismatch.");

  let clientId: string;
  let clientSecret: string;
  let appUrl: string;
  let appSlug: string;
  try {
    clientId = requireEnv("GITHUB_CLIENT_ID");
    clientSecret = requireEnv("GITHUB_CLIENT_SECRET");
    appUrl = requireEnv("APP_URL");
    appSlug = requireEnv("GITHUB_APP_SLUG");
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // Exchange the code for a user access token + refresh token.
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: oauthState.verifier,
    }),
    cache: "no-store",
  });
  const token = (await tokenRes.json()) as TokenResponse;
  if (!tokenRes.ok || !token.access_token || !token.refresh_token) {
    return NextResponse.json(
      { error: token.error_description ?? "Token exchange failed." },
      { status: 502 },
    );
  }

  const authHeaders = {
    Authorization: `Bearer ${token.access_token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Identify the user.
  const userRes = await fetch("https://api.github.com/user", {
    headers: authHeaders,
    cache: "no-store",
  });
  if (!userRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch GitHub user." },
      { status: 502 },
    );
  }
  const githubUser = (await userRes.json()) as GitHubUser;

  // Is the app already installed on the user's personal account?
  const installationsRes = await fetch(
    "https://api.github.com/user/installations",
    { headers: authHeaders, cache: "no-store" },
  );
  let installationId: number | undefined;
  if (installationsRes.ok) {
    const { installations } =
      (await installationsRes.json()) as InstallationsResponse;
    installationId = installations.find(
      (i) => i.account?.login === githubUser.login,
    )?.id;
  }

  const now = Math.floor(Date.now() / 1000);
  await setSession({
    user: {
      login: githubUser.login,
      name: githubUser.name,
      avatarUrl: githubUser.avatar_url,
    },
    userToken: token.access_token,
    userTokenExpiresAt: now + (token.expires_in ?? 28800),
    refreshToken: token.refresh_token,
    ...(installationId ? { installationId } : {}),
  });

  const destination = installationId
    ? // Already installed → continue where the flow started. Re-sanitized
      // here too (defense in depth) — never redirect off-site.
      new URL(sanitizeNext(oauthState.next), appUrl)
    : // Not installed → one click on GitHub's install screen (personal
      // account, "All repositories" pre-selected). GitHub then bounces to
      // the app's Setup URL = /api/auth/github/installed.
      new URL(`https://github.com/apps/${appSlug}/installations/new`);

  const response = NextResponse.redirect(destination);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
