"use client";

// The /resources/all explorer frame: a full-viewport graph canvas with a
// floating file-tree panel on the left and a preview card on the right.
// Owns all shared state — selection, graph focus requests, panel open — and
// wires the tree↔graph interaction both ways (tree click zooms the graph,
// graph click highlights + scrolls the tree). Adapted from the workspace
// shell pattern (localStorage persistence, rAF hydration, Ctrl+B toggle),
// but the tree floats over the canvas instead of being a grid column.

import { useEffect, useMemo, useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import type { ResourcesSnapshotState } from "@/lib/resources-graph";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FileTreePanel } from "./file-tree-panel";
import { GraphStage } from "./graph-stage";
import { NodePreviewCard } from "./node-preview-card";

const TREE_KEY = "resources-tree-open";

const isMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 1023px)").matches;

/** A zoom request from the tree to the graph. The nonce lets repeat clicks
 *  on the same target re-fire the graph's focus effect. */
export interface FocusRequest {
  kind: "node" | "folder";
  path: string;
  nonce: number;
}

interface ResourcesExplorerProps {
  state: ResourcesSnapshotState;
  className?: string;
}

export function ResourcesExplorer({ state, className }: ResourcesExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [focusReq, setFocusReq] = useState<FocusRequest | null>(null);
  const [treeOpen, setTreeOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [animated, setAnimated] = useState(false);

  const docs = useMemo(
    () => (state.status === "ready" ? state.data.docs : []),
    [state],
  );
  const docByPath = useMemo(
    () => new Map(docs.map((d) => [d.path, d])),
    [docs],
  );
  const linkCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (state.status === "ready") {
      for (const link of state.data.links) {
        counts.set(link.source, (counts.get(link.source) ?? 0) + 1);
        counts.set(link.target, (counts.get(link.target) ?? 0) + 1);
      }
    }
    return counts;
  }, [state]);

  const selectedDoc = selectedPath ? docByPath.get(selectedPath) : undefined;

  // Restore persisted panel state + honor ?focus=<path> after mount (never
  // in render — SSR mismatch). Read client-side on purpose: the server page
  // stays ISR-cacheable. The param is stripped so reloads don't re-zoom.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(TREE_KEY);
        if (raw !== null) setTreeOpen(raw === "true");
      } catch {
        // storage unavailable — keep the default
      }

      const focus = new URLSearchParams(window.location.search).get("focus");
      if (focus) {
        const path = focus.replace(/^\/+/, "");
        setSelectedPath(path);
        setFocusReq({ kind: "node", path, nonce: Date.now() });
        window.history.replaceState(null, "", "/resources/all");
      }

      if (isMobile()) setTreeOpen(false);
      setHydrated(true);
      requestAnimationFrame(() => setAnimated(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Persist panel state — a reader who browses collapsed stays collapsed.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(TREE_KEY, String(treeOpen));
    } catch {
      // storage unavailable — the panel still works for this session
    }
  }, [treeOpen, hydrated]);

  // Cmd/Ctrl+B toggles the tree (parity with the workspace).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setTreeOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Tree file → select + zoom the graph onto the node.
  const handleFileSelect = (path: string) => {
    setSelectedPath(path);
    setFocusReq({ kind: "node", path, nonce: Date.now() });
    if (isMobile()) setTreeOpen(false);
  };
  // Tree folder → zoom the graph onto that cluster (expansion stays in the tree).
  const handleFolderFocus = (path: string) => {
    setFocusReq({ kind: "folder", path, nonce: Date.now() });
  };
  // Graph node → select (tree highlights + scrolls); the graph is already there.
  const handleNodeSelect = (path: string) => {
    setSelectedPath(path);
  };
  const handleClearSelection = () => setSelectedPath(null);

  // GitHub unreachable or rate-limited — a first-class state, not an error.
  if (state.status === "unavailable") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 bg-background px-6 text-center">
        <h1 className="font-heading text-heading text-secondary">
          Resources are temporarily unavailable
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The resource library can&apos;t be reached right now — please try
          again shortly.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "relative h-dvh overflow-hidden",
          !animated && "[&_*]:transition-none",
          className,
        )}
      >
        {/* Graph fills the viewport */}
        <GraphStage
          state={state}
          selectedPath={selectedPath}
          focusReq={focusReq}
          onNodeSelect={handleNodeSelect}
          onBackgroundClick={handleClearSelection}
        />

        {/* Floating file tree (left) — slides out rather than unmounting so
            its scroll position and expansion state survive a collapse. */}
        <aside
          aria-hidden={!treeOpen}
          className={cn(
            "absolute bottom-3 left-3 top-3 z-20 flex w-72 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur",
            "transition-[transform] duration-200",
            treeOpen
              ? "translate-x-0"
              : "pointer-events-none -translate-x-[calc(100%+1rem)]",
          )}
        >
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
            <h2 className="font-heading text-sm font-semibold text-secondary">
              Resources
              {state.status === "ready" && (
                <span className="ml-2 font-normal text-muted-foreground">
                  {state.data.docs.length}
                </span>
              )}
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close file tree (Ctrl+B)"
              onClick={() => setTreeOpen(false)}
            >
              <PanelLeftOpen className="size-4 rotate-180" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FileTreePanel
              docs={docs}
              empty={state.status === "empty"}
              selectedPath={selectedPath}
              onFileSelect={handleFileSelect}
              onFolderFocus={handleFolderFocus}
            />
          </div>
        </aside>

        {/* Backdrop below lg: tapping outside closes the overlay tree */}
        {treeOpen && (
          <button
            type="button"
            aria-label="Close file tree"
            onClick={() => setTreeOpen(false)}
            className="fixed inset-0 z-10 bg-black/40 lg:hidden"
          />
        )}

        {hydrated && !treeOpen && (
          <FloatingButton
            label="Open file tree (Ctrl+B)"
            className="left-3 top-3"
            onClick={() => setTreeOpen(true)}
          >
            <PanelLeftOpen className="size-4" />
          </FloatingButton>
        )}

        {selectedDoc && (
          <NodePreviewCard
            doc={selectedDoc}
            linkCount={linkCounts.get(selectedDoc.path) ?? 0}
            onClose={handleClearSelection}
            className="absolute bottom-4 right-4 z-20"
          />
        )}
      </div>
    </TooltipProvider>
  );
}

function FloatingButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={label}
          onClick={onClick}
          className={cn("absolute z-20 bg-background shadow-sm", className)}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
