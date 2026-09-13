import type { Metadata } from "next";
import { OnboardingScreen } from "./_components/onboarding-screen";

export const metadata: Metadata = {
  title: "Get started — UnitEd Workspace",
  description: "Build your personal teaching workspace in a 2-minute chat.",
};

export default function WorkspaceStartPage() {
  // Session wiring comes in 04: getSession() decides `authenticated`, and a
  // session with an existing repo redirects to /workspace.
  return <OnboardingScreen authenticated={false} />;
}
