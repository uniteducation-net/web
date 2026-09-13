// Step 3 of the GitHub App auth chain: the app's Setup URL.
// GitHub redirects here after the user installs the app, with
// ?installation_id=… We bind the install to the logged-in account by checking
// it appears in THIS session user's /user/installations — never trusting the
// query param alone. Plan: 02-auth.md step 4.

import { NextRequest, NextResponse } from "next/server";
import { getSession, getValidUserToken, setSession } from "@/lib/session";

type InstallationsResponse = {
  installations: { id: number }[];
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
      "X-GitHub-Api-Version": "2022-11-28",
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
  if (!installations.some((i) => i.id === installationId)) {
    // The installation does not belong to the session user — reject it.
    return NextResponse.json(
      { error: "Installation does not belong to this account." },
      { status: 403 },
    );
  }

  await setSession({ ...session, installationId });
  return NextResponse.redirect(new URL("/workspace", request.nextUrl.origin));
}
