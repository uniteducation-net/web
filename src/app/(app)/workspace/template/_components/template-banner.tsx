"use client";

// 17 step 5 — the template workspace's persistent banner: the local-draft
// notice plus the one call to action that fits the visitor's auth state
// (server-computed in page.tsx). Presentational — the shell owns the
// create conversion and hands down its state. Auth CTAs go through
// GitHubConnectButton (lib/auth-popup.ts): GitHub opens in a small
// auto-closing window; this page never navigates.

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubConnectButton } from "@/components/github-connect-button";

export interface TemplateBannerError {
  message: string;
  reconnect?: boolean;
}

interface TemplateBannerProps {
  authState: "anonymous" | "no-repo" | "has-repo";
  creating: boolean;
  error: TemplateBannerError | null;
  onCreate(): void;
  /** The visitor closed the small GitHub window without connecting. */
  onConnectAborted?(): void;
}

export function TemplateBanner({
  authState,
  creating,
  error,
  onCreate,
  onConnectAborted,
}: TemplateBannerProps) {
  return (
    <div className="shrink-0 border-b border-border bg-muted">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {authState === "has-repo"
            ? "You already have a workspace — this draft stays in this browser."
            : "This template is a local draft — it lives only in this browser."}
        </p>
        {authState === "anonymous" &&
          (creating ? (
            <Button size="sm" className="shrink-0" disabled>
              <Sparkles className="size-4" />
              Creating your workspace…
            </Button>
          ) : (
            // Single click total: connect in the small window, then the
            // shell POSTs the create immediately (onConnected = onCreate).
            <GitHubConnectButton
              next="/workspace/template"
              variant="default"
              size="sm"
              className="shrink-0"
              onConnected={onCreate}
              onAborted={onConnectAborted}
            >
              Create my workspace
            </GitHubConnectButton>
          ))}
        {authState === "no-repo" && (
          <Button
            size="sm"
            className="shrink-0"
            onClick={onCreate}
            disabled={creating}
          >
            <Sparkles className="size-4" />
            {creating ? "Creating your workspace…" : "Create my workspace"}
          </Button>
        )}
        {authState === "has-repo" && (
          <Button size="sm" variant="outline" asChild className="shrink-0">
            <Link href="/workspace">Open it</Link>
          </Button>
        )}
      </div>
      {error && (
        <div className="flex items-center justify-center gap-3 border-t border-border px-4 py-1.5 text-xs">
          <span className="text-destructive">{error.message}</span>
          {error.reconnect && (
            <GitHubConnectButton
              inline
              next="/workspace/template"
              onConnected={onCreate}
            >
              Reconnect GitHub
            </GitHubConnectButton>
          )}
        </div>
      )}
    </div>
  );
}
