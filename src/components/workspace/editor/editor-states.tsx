"use client";

// 15 — body states for the workspace editor: loading skeleton, load-error
// card, non-markdown notice. Ported from the read-only preview (10) so the
// visual language is unchanged; the non-md copy now says "editing" because
// markdown files are editable, not just previewed.
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import { ExternalLink, FileWarning, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Document-shaped placeholder while a file (or the editor chunk) loads —
 *  the same six bars the read-only preview used. */
export function EditorSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-6 sm:p-8"
      aria-hidden
    >
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function EditorErrorCard({
  onRetry,
  githubUrl,
}: {
  onRetry(): void;
  githubUrl?: string;
}) {
  return (
    <CenteredCard>
      <FileWarning className="size-8 text-muted-foreground" />
      <p className="font-heading text-sm font-medium">
        Couldn&apos;t load this file
      </p>
      <p className="text-sm text-muted-foreground">
        It may have been moved or renamed — pick it again from the file tree
        {githubUrl ? ", or read it on GitHub" : ""}.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="size-3.5" />
          Try again
        </Button>
        {githubUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              View on GitHub
            </a>
          </Button>
        )}
      </div>
    </CenteredCard>
  );
}

/** Non-markdown file (rare in ICM): friendly notice + deep link, deliberately
 *  NOT a raw code dump (10 step 2). */
export function NonMarkdownNotice({
  path,
  githubUrl,
}: {
  path: string;
  githubUrl?: string;
}) {
  return (
    <CenteredCard>
      <FileWarning className="size-8 text-muted-foreground" />
      <p className="font-heading text-sm font-medium">
        Editing unavailable for this file type
      </p>
      <p className="text-sm text-muted-foreground">
        <span className="font-mono text-xs">{path}</span> can&apos;t be edited
        here.
      </p>
      {githubUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={githubUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-3.5" />
            View on GitHub
          </a>
        </Button>
      )}
    </CenteredCard>
  );
}

export function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-md border border-border bg-card p-8 text-center">
        {children}
      </div>
    </div>
  );
}
