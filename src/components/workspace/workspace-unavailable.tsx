"use client";

// Friendly replacement for Next's raw error page anywhere in the workspace.
// The /workspace guard talks to GitHub server-side; a hiccup there (slow
// network, a GitHub 5xx, a rate limit) must never strand a teacher on a
// technical error screen. Used by the segment error boundary (error.tsx)
// and rendered inline by the page guard.

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function WorkspaceUnavailable({ reset }: { reset?: () => void }) {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Logo />
      <p className="text-sm font-medium">
        We couldn&apos;t open your workspace.
      </p>
      <p className="max-w-xs text-xs text-muted-foreground">
        This is usually a hiccup reaching GitHub — reloading fixes it most of
        the time.
      </p>
      <Button
        size="sm"
        onClick={() => (reset ? reset() : window.location.reload())}
      >
        Reload
      </Button>
    </main>
  );
}
