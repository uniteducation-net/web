"use client";

import { ExternalLink, FileWarning, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { mockContents } from "../_lib/mock-workspace";

interface MarkdownPreviewProps {
  path: string;
  className?: string;
}

export function MarkdownPreview({ path, className }: MarkdownPreviewProps) {
  const segments = path.split("/");
  const isMarkdown = path.toLowerCase().endsWith(".md");
  const content = mockContents[path];

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
            <a href="#" onClick={(e) => e.preventDefault()}>
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">Open on GitHub</span>
            </a>
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Refresh file">
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </header>

      {isMarkdown && content != null ? (
        <ScrollArea className="flex-1">
          <article className="prose prose-neutral mx-auto max-w-2xl p-6 font-text sm:p-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </ScrollArea>
      ) : (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex max-w-sm flex-col items-center gap-3 rounded-md border border-border bg-card p-8 text-center">
            <FileWarning className="size-8 text-muted-foreground" />
            <p className="font-heading text-sm font-medium">
              Preview unavailable for this file type
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono text-xs">{path}</span> can&apos;t be
              rendered here.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="#" onClick={(e) => e.preventDefault()}>
                <ExternalLink className="size-3.5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
