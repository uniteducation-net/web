// Logout: clear OUR encrypted session cookie.
// NOTE: this only clears our cookie. Teachers who want to fully revoke access
// uninstall / revoke the app in GitHub → Settings → Applications → GitHub Apps
// (https://github.com/settings/installations). The UI links there (12).
// Plan: 02-auth.md step 5.

import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
