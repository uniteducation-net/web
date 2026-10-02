// Step 3 of the GitHub App auth chain: the app's Setup URL.
// GitHub redirects here after the user installs the app, with
// ?installation_id=… We bind the install to the logged-in account by checking
// it appears in THIS session user's /user/installations — never trusting the
// query param alone. Plan: 02-auth.md step 4.
// PERSONAL ACCOUNT ONLY: an install on an organization the teacher admins is
// refused (workspace repos live in the teacher's own account — see
// lib/github.ts#isPersonalInstallation) and routed to the wrong-account
// explainer instead of poisoning session.installationId.

import { NextRequest, NextResponse } from "next/server";
import {
  GITHUB_API_VERSION,
  isPersonalInstallation,
  type UserInstallation,
} from "@/lib/github";
import {
  AUTH_NEXT_COOKIE,
  getSession,
  getValidUserToken,
  sanitizeNext,
  setSession,
  unsealAuthNext,
} from "@/lib/session";

type InstallationsResponse = {
  installations: UserInstallation[];
};

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("installation_id");
  const installationId = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(installationId)) {
    return NextResponse.json(
      { error: "Missing or invalid installation_id." },
      { status: 400 },
    );
  }

  const session = await getSession();
  if (!session) {
    // No session → restart the flow (authorize → install).
    return NextResponse.redirect(
      new URL("/api/auth/github", request.nextUrl.origin),
    );
  }

  const userToken = await getValidUserToken();
  if (!userToken) {
    return NextResponse.redirect(
      new URL("/api/auth/github", request.nextUrl.origin),
    );
  }

  const res = await fetch("https://api.github.com/user/installations", {
    headers: {
      Authorization: `Bearer ${userToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to verify installation." },
      { status: 502 },
    );
  }
  const { installations } = (await res.json()) as InstallationsResponse;
  const installation = installations.find((i) => i.id === installationId);
  if (!installation) {
    // The installation does not belong to the session user — reject it.
    return NextResponse.json(
      { error: "Installation does not belong to this account." },
      { status: 403 },
    );
  }

  // Consume `next` up front — every branch below redirects.
  const rawNext = request.cookies.get(AUTH_NEXT_COOKIE)?.value;
  const sealedNext = rawNext ? await unsealAuthNext(rawNext) : null;

  if (!isPersonalInstallation(installation, session.user.login)) {
    // Installed on an org (or another account) the teacher admins — binding
    // it would poison session.installationId. Send them to the explainer,
    // which offers a retry that lands back on the install screen.
    const response = NextResponse.redirect(
      new URL(
        "/workspace/auth-complete?connect=wrong-account",
        request.nextUrl.origin,
      ),
    );
    response.cookies.delete(AUTH_NEXT_COOKIE);
    return response;
  }

  await setSession({ ...session, installationId });
  // Return where the flow started: the callback stashed `next` in the signed
  // auth_next cookie before the install-screen bounce (popup flows land on
  // the auto-close page). Signature-verified AND re-sanitized — never trust
  // a cookie blindly. Falls back to /workspace (the pre-popup behavior).
  const response = NextResponse.redirect(
    new URL(sanitizeNext(sealedNext), request.nextUrl.origin),
  );
  response.cookies.delete(AUTH_NEXT_COOKIE);
  return response;
}
