import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findExistingWorkspace } from "@/lib/github";
import { OnboardingScreen } from "./_components/onboarding-screen";

export const metadata: Metadata = {
  title: "Get started — UnitEd Workspace",
  description: "Build your personal teaching workspace in a 2-minute chat.",
};

// Onboarding (04 step 3). Works anonymously AND logged-in-without-repo —
// `authenticated` only controls the save-button label. Reverse guard: a
// session whose workspace repo already exists goes straight to /workspace;
// onboarding is unreachable once the workspace exists.
export default async function WorkspaceStartPage() {
  const session = await getSession();
  if (session) {
    const repo = await findExistingWorkspace(session);
    if (repo) redirect("/workspace");
  }
  return <OnboardingScreen authenticated={Boolean(session)} />;
}
