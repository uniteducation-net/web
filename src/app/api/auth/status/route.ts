// Auth probe for the popup connect flow (lib/auth-popup.ts): after the small
// window closes, callers re-check SERVER truth instead of trusting the
// popup's signal (message-vs-close races, mobile tabs, stripped openers are
// all harmless this way). Cookie-only — never calls GitHub, cheap enough to
// hit on every close. No botid: read-only, low sensitivity, must answer
// instantly right after the popup closes.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    session
      ? {
          authenticated: true,
          user: session.user,
          installationId: session.installationId ?? null,
          repo: session.repo ?? null,
        }
      : { authenticated: false },
    { headers: { "Cache-Control": "no-store" } },
  );
}
