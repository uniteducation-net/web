// The anonymous template workspace (17): the real editor over a local draft,
// open to everyone — no guard redirect. The auth state only changes the
// banner's call to action (log in / create / open your workspace).
// Plan: docs/plans/icm-workspace-plan/17-template-workspace.md

import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { findExistingWorkspace } from "@/lib/github";
import { TemplateShell } from "./_components/template-shell";

export const metadata: Metadata = {
  title: "Template — UnitEd Workspace",
  description: "A blank teaching workspace you can shape before logging in.",
};

export default async function WorkspaceTemplatePage() {
  const session = await getSession();
  let authState: "anonymous" | "no-repo" | "has-repo" = "anonymous";
  if (session) {
    authState = (await findExistingWorkspace(session))
      ? "has-repo"
      : "no-repo";
  }
  return <TemplateShell authState={authState} />;
}
