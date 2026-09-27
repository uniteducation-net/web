// Logout: clear OUR encrypted session cookie.
// NOTE: this only clears our cookie. Teachers who want to fully revoke access
// uninstall / revoke the app in GitHub → Settings → Applications → GitHub Apps
// (https://github.com/settings/installations). The UI links there (12).
// Plan: 02-auth.md step 5.

import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { isBotRequest } from "@/lib/botid";

export async function POST() {
  if (await isBotRequest()) {
    return NextResponse.json({ error: "access_denied" }, { status: 403 });
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
