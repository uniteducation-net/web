"use client";

// The ONE GitHub connect CTA (lib/auth-popup.ts has the flow). Progressive
// enhancement: a real <a href="/api/auth/github?next=…"> — works without JS,
// with middle-click, and when popups are blocked (the click handler then
// falls back to the anchor's own full-page navigation = the old behavior).
// With JS and an allowed popup, GitHub opens in the small auto-closing
// window and the main page never navigates.

import { useState, type MouseEvent, type ReactNode } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  authStartUrl,
  connectGitHub,
  suppressNextUnloadPrompt,
  type AuthStatus,
} from "@/lib/auth-popup";

interface GitHubConnectButtonProps {
  /** Where the FULL-PAGE flow returns (the popup flow always auto-closes). */
  next: string;
  onConnected?(status: AuthStatus): void;
  onAborted?(): void;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm";
  /** Render the underline-link style used by error-card reconnect CTAs. */
  inline?: boolean;
  /** Show the "finishes in the small window" note while pending. */
  showHelper?: boolean;
  className?: string;
  children: ReactNode;
}

export function GitHubConnectButton({
  next,
  onConnected,
  onAborted,
  variant = "ghost",
  size = "sm",
  inline,
  showHelper,
  className,
  children,
}: GitHubConnectButtonProps) {
  const [pending, setPending] = useState(false);
  const href = authStartUrl(next);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks keep plain-anchor semantics (new tab/window).
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    if (pending) return;
    // connectGitHub's first action is window.open — synchronous inside the
    // click, so transient activation survives.
    const result = connectGitHub();
    setPending(true);
    void result.then((r) => {
      setPending(false);
      if (r.outcome === "blocked") {
        // Full-page — the anchor's own behavior. The hop is intentional and
        // the local draft survives, so hush the template's unload prompt.
        suppressNextUnloadPrompt();
        window.location.assign(href);
        return;
      }
      if (r.outcome === "connected") onConnected?.(r.status);
      else onAborted?.();
    });
  };

  const note = showHelper && pending && (
    <p className="mt-1 text-xs text-muted-foreground">
      Finish the one GitHub step in the small window — it closes by itself.
    </p>
  );

  if (inline) {
    return (
      <span className={className}>
        <a
          href={href}
          onClick={handleClick}
          aria-busy={pending}
          className="font-medium text-primary underline underline-offset-2"
        >
          {pending ? "Waiting for GitHub…" : children}
        </a>
        {note}
      </span>
    );
  }
  return (
    <span className={className}>
      <Button variant={variant} size={size} asChild aria-busy={pending}>
        <a href={href} onClick={handleClick}>
          <LogIn className="size-4" />
          {pending ? "Waiting for GitHub…" : children}
        </a>
      </Button>
      {note}
    </span>
  );
}
