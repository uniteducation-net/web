// Step 2 of the GitHub App auth chain: OAuth callback.
// Verifies `state`, exchanges the code (with PKCE verifier) for a user access
// token + refresh token, fetches the user's identity and installations, writes
// the encrypted session cookie, then either continues to `next` (app already
// installed) or bounces the user to the app's install screen. Plan: 02-auth.md
// step 3. IMPORTANT: no repo is created here — that happens in 07.

import { NextRequest, NextResponse } from "next/server";
import { GITHUB_API_VERSION } from "@/lib/github";
import {
  AUTH_NEXT_COOKIE,
  AUTH_NEXT_MAX_AGE,
  OAUTH_STATE_COOKIE,
  getSession,
  mergeAuthSession,
  requireEnv,
  sanitizeNext,
  sealAuthNext,
  setSession,
  unsealAuthNext,
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
  if (!code) return badRequest("Missing code.");

  // Two callback shapes (02-auth):
  // - User-initiated: code + state — state verified against the sealed
  //   cookie, the exchange uses its PKCE verifier, `next` restored from it.
  // - GitHub-initiated (install / permission update with "Request user
  //   authorization during installation" enabled): code + installation_id +
  //   setup_action, NO state — GitHub started the flow, so there is no cookie
  //   to verify against and no PKCE challenge was sent. Rejecting these
  //   strands the user right after they approve permissions on GitHub — the
  //   fresh code carrying the upgraded token gets discarded (99 #11).
  let verifier: string | undefined;
  let next = "/workspace";
  if (state) {
    const rawState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    if (!rawState) return badRequest("Missing oauth_state cookie.");
    // The cookie is signed (02 step 2) — a forged or expired one never parses.
    const oauthState = await unsealOAuthState(rawState);
    if (!oauthState) return badRequest("Corrupt oauth_state cookie.");
    if (oauthState.state !== state) return badRequest("State mismatch.");
    verifier = oauthState.verifier;
    next = oauthState.next;
  } else if (
    !searchParams.get("installation_id") &&
    !searchParams.get("setup_action")
  ) {
    return badRequest("Missing code or state.");
  }

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
      // Only the user-initiated flow sent a PKCE challenge — GitHub-initiated
      // callbacks exchange without a verifier.
      ...(verifier ? { code_verifier: verifier } : {}),
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
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
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
  // Merge, never replace (lib/session.ts#mergeAuthSession): this route runs on
  // every connect leg, and a wholesale write would drop `repo`/BYOK state a
  // concurrent request just persisted.
  await setSession(
    mergeAuthSession(await getSession(), {
      user: {
        login: githubUser.login,
        name: githubUser.name,
        avatarUrl: githubUser.avatar_url,
      },
      userToken: token.access_token,
      userTokenExpiresAt: now + (token.expires_in ?? 28800),
      refreshToken: token.refresh_token,
      ...(installationId ? { installationId } : {}),
    }),
  );

  let destination: URL;
  if (installationId) {
    // Already installed → continue where the flow started. The stashed
    // auth_next (set by the not-installed branch of an earlier leg) wins over
    // the state `next`: it carries the popup flow's auto-close page, so the
    // post-install leg — GitHub-initiated, no state, when the registration
    // has OAuth-during-install on and no Setup URL — still lands on
    // /workspace/auth-complete and the small window closes itself instead of
    // loading the full app inside the popup. Re-sanitized (defense in depth).
    const rawAuthNext = request.cookies.get(AUTH_NEXT_COOKIE)?.value;
    const sealedNext = rawAuthNext ? await unsealAuthNext(rawAuthNext) : null;
    destination = new URL(sanitizeNext(sealedNext ?? next), appUrl);
  } else {
    // Not installed → one click on GitHub's install screen (personal
    // account, "All repositories" pre-selected). GitHub then bounces to
    // the app's Setup URL = /api/auth/github/installed (when configured) or
    // back here GitHub-initiated.
    destination = new URL(`https://github.com/apps/${appSlug}/installations/new`);
  }

  const response = NextResponse.redirect(destination);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  if (installationId) {
    response.cookies.delete(AUTH_NEXT_COOKIE); // consumed above (or stale)
  } else {
    // The install screen bounces to the Setup URL without our query params —
    // stash `next` (signed) so /installed can return the user where the flow
    // started. Popup flows (lib/auth-popup.ts) pass the auto-close page as
    // next, so the small window closes itself even after an install.
    response.cookies.set(AUTH_NEXT_COOKIE, await sealAuthNext(sanitizeNext(next)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_NEXT_MAX_AGE,
    });
  }
  return response;
}
