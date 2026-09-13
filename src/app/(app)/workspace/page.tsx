import Link from "next/link";

export default function WorkspacePage() {
  // Becomes the guard in 04: no session / no repo → redirect('/workspace/start'),
  // repo exists → render <WorkspaceShell />. Until then, a static signpost.
  return (
    <main className="grid h-full place-items-center p-6">
      <div className="max-w-sm text-center">
        <h1 className="font-heading text-title text-secondary">Workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          New here? A short chat builds your personal teaching workspace.
        </p>
        <Link
          href="/workspace/start"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Get started
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">
          <Link href="/workspace/demo" className="underline underline-offset-2">
            Preview the workspace shell →
          </Link>
        </p>
      </div>
    </main>
  );
}
