"use client";

// See page.tsx for why this page exists and where it lives.

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { AUTH_COMPLETE_MESSAGE } from "@/lib/auth-popup";

export function AuthCompleteClient() {
  // window.opener only exists client-side and never changes during this
  // page's life — useSyncExternalStore's separate server/client snapshots
  // read it without a hydration mismatch or an effect setState.
  const hasOpener = useSyncExternalStore(
    () => () => {},
    () => Boolean(window.opener),
    () => false,
  );

  useEffect(() => {
    if (!window.opener) return;
    window.opener.postMessage(AUTH_COMPLETE_MESSAGE, window.location.origin);
    // Give the message event a beat to dispatch before the window dies.
    const timer = setTimeout(() => window.close(), 150);
    return () => clearTimeout(timer);
  }, []);

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
