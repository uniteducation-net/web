"use client";

// 17 step 5 — the template workspace's persistent banner: the local-draft
// notice plus the one call to action that fits the visitor's auth state
// (server-computed in page.tsx). Presentational — the shell owns the
// create conversion and hands down its state.

import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TemplateBannerError {
  message: string;
  reconnect?: boolean;
}

interface TemplateBannerProps {
  authState: "anonymous" | "no-repo" | "has-repo";
  creating: boolean;
  error: TemplateBannerError | null;
  onCreate(): void;
}

/** Full-document nav into the GitHub OAuth chain; the local draft survives
 *  in localStorage and the flow returns here (`next`). Plain <a>, not Link —
 *  an API route that 302s to GitHub wants a document navigation. */
const LOGIN_HREF = "/api/auth/github?next=/workspace/template";

export function TemplateBanner({
  authState,
  creating,
  error,
  onCreate,
}: TemplateBannerProps) {
  return (
    <div className="shrink-0 border-b border-border bg-muted">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {authState === "has-repo"
            ? "You already have a workspace — this draft stays in this browser."
            : "This template is a local draft — it lives only in this browser."}
        </p>
        {authState === "anonymous" && (
          <Button size="sm" asChild className="shrink-0">
            <a href={LOGIN_HREF}>
              <LogIn className="size-4" />
              Log in to save your workspace
            </a>
          </Button>
        )}
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
            <a
              href={LOGIN_HREF}
              className="font-medium text-primary underline underline-offset-2"
            >
              Reconnect GitHub
            </a>
          )}
        </div>
      )}
    </div>
  );
}
