"use client";

// 15 — editor chrome: breadcrumb + actions row. Save and Discard render
// only while dirty (user spec); Refresh is disabled while dirty (save or
// discard first). Without `githubUrl` (the demo) the GitHub link is hidden.
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import { ExternalLink, RotateCcw } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { EditorDiscardButton } from "./editor-discard-button";
import { EditorSaveButton } from "./editor-save-button";

interface EditorHeaderProps {
  path: string;
  githubUrl?: string;
  isMarkdown: boolean;
  dirty: boolean;
  saving: boolean;
  loading: boolean;
  refreshing: boolean;
  onSave(): void;
  onDiscard(): void;
  onRefresh(): void;
}

export function EditorHeader({
  path,
  githubUrl,
  isMarkdown,
  dirty,
  saving,
  loading,
  refreshing,
  onSave,
  onDiscard,
  onRefresh,
}: EditorHeaderProps) {
  const segments = path.split("/");

  return (
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
        {dirty && (
          <>
            <EditorSaveButton saving={saving} onClick={onSave} />
            <EditorDiscardButton onDiscard={onDiscard} />
          </>
        )}
        {githubUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">Open on GitHub</span>
            </a>
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh file"
              onClick={onRefresh}
              disabled={!isMarkdown || loading || dirty}
            >
              <RotateCcw
                className={cn("size-3.5", refreshing && "animate-spin")}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {dirty ? "Save or discard your changes first" : "Refresh"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
