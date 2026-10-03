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
    // Classified, credential-safe metadata (never headers/tokens/key
    // material) — one grep in Vercel logs names the failure class.
    console.error("workspace guard failed:", {
      name: (err as Error)?.name,
      status: (err as { status?: number })?.status,
      url: (err as { request?: { url?: string } })?.request?.url,
      message: (err as Error)?.message?.slice(0, 200),
    });
    return <WorkspaceUnavailable />;
  }
  if (!repo) redirect("/workspace/start");

  return <WorkspaceShell repo={repo} user={session.user} />;
}
