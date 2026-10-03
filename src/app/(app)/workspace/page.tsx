import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findExistingWorkspace } from "@/lib/github";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { WorkspaceUnavailable } from "@/components/workspace/workspace-unavailable";

// The guard (04 step 2). /workspace is the single canonical entry — it only
// routes, server-side: no session / no repo → onboarding; repo → the shell.
// Returning users land straight in the shell without ever loading onboarding
// code. Thin on purpose: all logic lives in session/github helpers.
// The guard talks to GitHub — a failure there (slow network, 5xx, rate
// limit) renders a friendly reload state, never Next's raw error page.
export default async function WorkspacePage() {
  const session = await getSession();
  if (!session) redirect("/workspace/start");

  let repo;
  try {
    repo = await findExistingWorkspace(session);
  } catch (err) {
    // Logged server-side (digest stays searchable in Vercel logs).
    console.error("workspace guard failed:", err);
    return <WorkspaceUnavailable />;
  }
  if (!repo) redirect("/workspace/start");

  return <WorkspaceShell repo={repo} user={session.user} />;
}
