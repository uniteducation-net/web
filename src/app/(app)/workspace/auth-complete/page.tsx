// The popup connect flow's final hop (lib/auth-popup.ts): the OAuth/install
// chain lands here INSIDE the small window, which messages the opener and
// closes itself. Reached without an opener (mobile tab, direct visit, a
// stripped-opener in-app browser) it explains itself and links onward.
// Lives under /workspace because the locale proxy (src/proxy.ts) would 308 a
// top-level /auth/* path into /en/auth/*, and this route group's root layout
// is scoped to the workspace segment.

import type { Metadata } from "next";
import { AuthCompleteClient } from "./auth-complete-client";

export const metadata: Metadata = {
  title: "Connected — UnitEd Workspace",
  robots: { index: false, follow: false },
};

export default function AuthCompletePage() {
  return <AuthCompleteClient />;
}
