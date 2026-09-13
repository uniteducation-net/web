import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findExistingWorkspace } from "@/lib/github";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

// The guard (04 step 2). /workspace is the single canonical entry — it only
// routes, server-side: no session / no repo → onboarding; repo → the shell.
// Returning users land straight in the shell without ever loading onboarding
// code. Thin on purpose: all logic lives in session/github helpers.
export default async function WorkspacePage() {
  const session = await getSession();
  if (!session) redirect("/workspace/start");

  const repo = await findExistingWorkspace(session);
  if (!repo) redirect("/workspace/start");

  return <WorkspaceShell repo={repo} user={session.user} />;
}
