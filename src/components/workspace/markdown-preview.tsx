"use client";

// 10 — center column: the calm reading surface. Fetches the selected file
// from /api/workspace/file and renders it with react-markdown + remark-gfm
// inside a `prose` container. No raw code view, no editing in v1 — teachers
// edit by asking the agent (11). The returned `sha` is kept in client state
// (`result.file.sha`) for those safe writes later.
//
// SWR-style cache keyed by path (a ref Map): revisiting a file shows the
// cached copy instantly. When the shell bumps `refreshKey` (the agent wrote
// files, 11), the cache is dropped and the open file re-fetched — if its sha
// moved, a subtle "Updated just now" toast tells the teacher the AI changed
// something.
// Plan: docs/plans/icm-workspace-plan/10-markdown-preview.md

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileWarning, RotateCcw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SessionRepo } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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

interface FileData {
  path: string;
  content: string;
  /** Kept for safe writes in 11 (writeFile requires the last-read sha). */
  sha: string;
}

/** Fetch result, tagged with the path it belongs to so a stale response for
 *  a previous selection is never rendered. */
interface FetchResult {
  path: string;
  file: FileData | null;
  failed: boolean;
}

async function fetchFile(path: string): Promise<FileData | "unauthorized"> {
  const res = await fetch(
    `/api/workspace/file?path=${encodeURIComponent(path)}`,
    { cache: "no-store" },
  );
  if (res.status === 401) return "unauthorized";
  if (!res.ok) throw new Error(`file fetch failed: ${res.status}`);
  return (await res.json()) as FileData;
}

interface MarkdownPreviewProps {
  path: string;
  repo: SessionRepo;
  /** Bump to re-fetch the open file — the shell bumps it when the agent
   *  (11) writes files. */
  refreshKey?: number;
  className?: string;
}

export function MarkdownPreview({
  path,
  repo,
  refreshKey = 0,
  className,
}: MarkdownPreviewProps) {
  const segments = path.split("/");
  const isMarkdown = path.toLowerCase().endsWith(".md");
  const githubUrl = `https://github.com/${repo.owner}/${repo.name}/blob/HEAD/${path}`;

  const [result, setResult] = useState<FetchResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const router = useRouter();
  const cacheRef = useRef(new Map<string, FileData>());
  const handledRefreshKeyRef = useRef(refreshKey);

  // Derive the view for the CURRENT path — a result for another path (or
  // none yet) reads as loading, never as stale content.
  const current = result && result.path === path ? result : null;
  const file = current?.file ?? null;
  const failed = current?.failed ?? false;
  const loading = isMarkdown && !current;

  // Fetch on path change; on refreshKey bump, drop the cache first (the
  // agent may have written any number of files) and force a fresh read.
  useEffect(() => {
    if (!isMarkdown) return;
    const refresh = handledRefreshKeyRef.current !== refreshKey;
    handledRefreshKeyRef.current = refreshKey;
    // The sha as last shown — a refresh-driven re-read that moves it means
    // the agent rewrote the open file (10 step 5).
    const prevSha = refresh ? cacheRef.current.get(path)?.sha : undefined;
    if (refresh) cacheRef.current.clear();
    const cached = refresh ? undefined : cacheRef.current.get(path);

    let cancelled = false;
    (async () => {
      // Yield first so cache hits are async too — the current content never
      // flashes, and state updates stay out of the synchronous effect body.
      await Promise.resolve();
      if (cancelled) return;
      if (cached) {
        setResult({ path, file: cached, failed: false });
        return;
      }
      try {
        const data = await fetchFile(path);
        if (cancelled) return;
        if (data === "unauthorized") {
          // Expired session (same contract as the tree, 09 step 6): re-auth
          // is one click and GitHub remembers them.
          router.replace("/api/auth/github");
          return;
        }
        cacheRef.current.set(path, data);
        if (refresh && prevSha && prevSha !== data.sha) setJustUpdated(true);
        setResult({ path, file: data, failed: false });
      } catch {
        if (!cancelled) setResult({ path, file: null, failed: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, refreshKey, isMarkdown, router]);

  // Manual refresh — quiet (no toast): the teacher asked for it.
  const refresh = () => {
    cacheRef.current.delete(path);
    setRefreshing(true);
    (async () => {
      try {
        const data = await fetchFile(path);
        if (data === "unauthorized") {
          router.replace("/api/auth/github");
          return;
        }
        cacheRef.current.set(path, data);
        setResult({ path, file: data, failed: false });
      } catch {
        // Keep showing the last good copy — the teacher loses nothing.
        setResult((prev) =>
          prev && prev.path === path
            ? { ...prev, failed: true }
            : { path, file: null, failed: true },
        );
      } finally {
        setRefreshing(false);
      }
    })();
  };

  // Auto-dismiss the "Updated just now" toast.
  useEffect(() => {
    if (!justUpdated) return;
    const timer = setTimeout(() => setJustUpdated(false), 5000);
    return () => clearTimeout(timer);
  }, [justUpdated]);

  return (
    <div
      className={cn(
        "relative flex h-full min-w-0 flex-col bg-background",
        className,
      )}
    >
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Refresh file"
                onClick={refresh}
                disabled={!isMarkdown || loading}
              >
                <RotateCcw
                  className={cn("size-3.5", refreshing && "animate-spin")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {!isMarkdown ? (
        // Non-markdown file (rare in ICM): friendly notice + deep link,
        // deliberately NOT a raw code dump (10 step 2).
        <CenteredCard>
          <FileWarning className="size-8 text-muted-foreground" />
          <p className="font-heading text-sm font-medium">
            Preview unavailable for this file type
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-xs">{path}</span> can&apos;t be
            rendered here.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              View on GitHub
            </a>
          </Button>
        </CenteredCard>
      ) : loading ? (
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-6 sm:p-8">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : failed && !file ? (
        <CenteredCard>
          <FileWarning className="size-8 text-muted-foreground" />
          <p className="font-heading text-sm font-medium">
            Couldn&apos;t load this file
          </p>
          <p className="text-sm text-muted-foreground">
            It may have been moved or renamed — pick it again from the file
            tree, or read it on GitHub.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RotateCcw className="size-3.5" />
              Try again
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={githubUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </CenteredCard>
      ) : file ? (
        <ScrollArea className="flex-1">
          <article className="prose prose-neutral mx-auto max-w-2xl p-6 font-text sm:p-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {file.content}
            </ReactMarkdown>
          </article>
        </ScrollArea>
      ) : null}

      {/* 10 step 5 — the agent rewrote the open file. Subtle, self-dismissing. */}
      {justUpdated && (
        <div
          role="status"
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-secondary shadow-sm"
        >
          <Sparkles className="size-3.5 text-muted-foreground" />
          Updated just now
        </div>
      )}
    </div>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-md border border-border bg-card p-8 text-center">
        {children}
      </div>
    </div>
  );
}
