"use client";

// Friendly replacement for Next's raw error page anywhere in the workspace.
// The /workspace guard talks to GitHub server-side; a hiccup there (slow
// network, a GitHub 5xx, a rate limit) must never strand a teacher on a
// technical error screen. Reload is the first fix; when the state itself is
// stuck, "Log out and start over" clears OUR session cookie (GitHub account,
// workspace repo, and files stay untouched) behind an explicit confirm —
// never automatically. Used by the segment error boundary (error.tsx) and
// rendered inline by the page guard.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function WorkspaceUnavailable({ reset }: { reset?: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const startOver = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    // Clears only our encrypted session cookie (02 step 5). Hard-nav so the
    // start page renders from a truly clean state.
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/workspace/start";
  };

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
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => (reset ? reset() : window.location.reload())}
        >
          Reload
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirmOpen(true)}
        >
          Log out and start over
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>
              This logs you out of UnitEd on this device. Your GitHub account,
              your workspace, and all your files stay untouched — you can log
              straight back in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              size="sm"
              onClick={() => void startOver()}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out…" : "Log out and start over"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
