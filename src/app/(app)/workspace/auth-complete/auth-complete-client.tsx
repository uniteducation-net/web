"use client";

// See page.tsx for why this page exists and where it lives.

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { AUTH_COMPLETE_MESSAGE, authStartUrl } from "@/lib/auth-popup";

export function AuthCompleteClient() {
  // window.opener only exists client-side and never changes during this
  // page's life — useSyncExternalStore's separate server/client snapshots
  // read it without a hydration mismatch or an effect setState.
  const hasOpener = useSyncExternalStore(
    () => () => {},
    () => Boolean(window.opener),
    () => false,
  );

  // /api/auth/github/installed lands here with ?connect=wrong-account when
  // the teacher installed the app on an organization instead of their own
  // account. That state must NOT message the opener or auto-close — the
  // teacher needs the explanation and the retry, both inside this window.
  const wrongAccount = useSearchParams().get("connect") === "wrong-account";

  useEffect(() => {
    if (wrongAccount || !window.opener) return;
    window.opener.postMessage(AUTH_COMPLETE_MESSAGE, window.location.origin);
    // Give the message event a beat to dispatch before the window dies.
    const timer = setTimeout(() => window.close(), 150);
    return () => clearTimeout(timer);
  }, [wrongAccount]);

  if (wrongAccount) {
    return (
      <main className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Logo />
        <p className="text-sm font-medium">
          Almost — you connected UnitEd to an organization.
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Your workspace lives in <strong>your</strong> GitHub account. On the
          GitHub screen, pick your own username instead of the organization.
        </p>
        {/* Restarts OAuth inside this window: the callback finds no personal
            installation and bounces straight to GitHub's account picker. */}
        <Button size="sm" asChild>
          <a href={authStartUrl("/workspace/auth-complete")}>Try again</a>
        </Button>
        {hasOpener ? (
          <button
            type="button"
            onClick={() => window.close()}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Close this window
          </button>
        ) : (
          <Link
            href="/workspace"
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Continue to your workspace
          </Link>
        )}
      </main>
    );
  }

  return (
    <main className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Logo />
      <p className="text-sm font-medium">
        You&apos;re connected — this window closes by itself.
      </p>
      <p className="text-xs text-muted-foreground">
        If it doesn&apos;t, you can close it now.
      </p>
      {hasOpener ? (
        <Button size="sm" onClick={() => window.close()}>
          Close
        </Button>
      ) : (
        <Button size="sm" asChild>
          <Link href="/workspace">Continue to your workspace</Link>
        </Button>
      )}
    </main>
  );
}
