"use client";

// 08/10 — center column: the calm reading surface. Header (breadcrumb +
// GitHub deep link) is real; the body is a placeholder until 10 fetches and
// renders the file from /api/workspace/file. No raw code, no terminal.
// Plan: docs/plans/icm-workspace-plan/10-markdown-preview.md

import { ExternalLink, FileText, RotateCcw } from "lucide-react";
import type { SessionRepo } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  path: string;
  repo: SessionRepo;
  className?: string;
}

export function MarkdownPreview({
  path,
  repo,
  className,
}: MarkdownPreviewProps) {
  const segments = path.split("/");
  const githubUrl = `https://github.com/${repo.owner}/${repo.name}/blob/HEAD/${path}`;

  return (
    <div className={cn("flex h-full min-w-0 flex-col bg-background", className)}>
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap font-mono text-xs">
            {segments.map((segment, i) => {
              const isLast = i === segments.length - 1;
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="max-w-40 truncate text-secondary">
                        {segment}
                      </BreadcrumbPage>
                    ) : (
                      <span className="text-muted-foreground">{segment}</span>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">Open on GitHub</span>
            </a>
          </Button>
          {/* TODO(10-markdown-preview): re-fetch /api/workspace/file?path=… */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Refresh file"
                  disabled
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Refresh (coming soon)</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* TODO(10-markdown-preview): fetch the file and render it with
          react-markdown + remark-gfm inside `prose` (see the demo route for
          the target layout). Until then, a calm placeholder. */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-md border border-border bg-card p-8 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <p className="font-heading text-sm font-medium text-secondary">
            {segments[segments.length - 1]}
          </p>
          <p className="text-sm text-muted-foreground">
            The formatted preview connects to your repo in the next step. For
            now you can read this file on GitHub.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
