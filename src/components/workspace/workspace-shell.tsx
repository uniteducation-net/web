import type { SessionRepo } from "@/lib/session";

interface WorkspaceShellProps {
  repo: SessionRepo;
}

// Placeholder shell — 08 replaces this with the real 3-column
// (sidebar | markdown preview | agent panel) client component at this path.
// Kept as a Server Component; only renders when the guard found a repo, so
// onboarding code never ships on this route.
export function WorkspaceShell({ repo }: WorkspaceShellProps) {
  return (
    <main className="grid h-full place-items-center p-6">
      <div className="max-w-sm text-center">
        <h1 className="font-heading text-title text-secondary">
          {repo.owner}/{repo.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your workspace is connected. The editor shell is on its way.
        </p>
      </div>
    </main>
  );
}
