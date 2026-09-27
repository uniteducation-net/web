"use client";

// Floating tree of the resources repo's markdown files. Data arrives by
// props from the server page (no fetching here). Adapted from the
// workspace's file-tree.tsx — same buildTree (folders-first natural sort)
// and row visuals — with three deltas: folders are zoom targets (row click
// toggles expansion AND focuses the graph cluster), selection syncs from
// graph clicks (ancestors auto-expand + row scrolls into view), and all
// folders start closed (the repo grows to ~2k files) with a collapse-all
// button to reset expansion. A sticky filter
// row on top prunes the tree by case-insensitive label substring; while a
// filter is active, surviving folders render open and manual expansion state
// is left untouched for when the filter clears.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Folder, ListCollapse, Search, X } from "lucide-react";
import type { ResourceDocMeta } from "@/lib/resources-graph";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isFolder: boolean;
  /** Reader URL (files only) — rows render as real anchors so crawlers can
   *  follow them. */
  href?: string;
  /** Recursive markdown-file count, for folder badges. */
  fileCount: number;
}

/** Doc paths → nested tree. Folders first, natural sort (numbered prefixes
 *  like 01-, 02- order correctly). */
function buildTree(docs: ResourceDocMeta[]): TreeNode[] {
  const root: TreeNode = {
    name: "",
    path: "",
    children: [],
    isFolder: true,
    fileCount: 0,
  };

  for (const doc of docs) {
    const segments = doc.path.split("/");
    let node = root;
    segments.forEach((segment, i) => {
      const segmentPath = segments.slice(0, i + 1).join("/");
      const isFolder = i < segments.length - 1;
      let child = node.children.find(
        (c) => c.name === segment && c.isFolder === isFolder,
      );
      if (!child) {
        child = {
          name: segment,
          path: segmentPath,
          children: [],
          isFolder,
          fileCount: 0,
        };
        node.children.push(child);
      }
      if (isFolder) child.fileCount++;
      else child.href = doc.href;
      node = child;
    });
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(root.children);

  return root.children;
}

/** Every ancestor folder path of a file path ("a/b/c.md" → ["a", "a/b"]). */
function ancestorsOf(path: string): string[] {
  const segments = path.split("/");
  return segments.slice(0, -1).map((_, i) => segments.slice(0, i + 1).join("/"));
}

/** The label a row shows — files hide their .md extension, so the filter
 *  matches what the reader sees. */
function labelOf(node: TreeNode): string {
  return node.isFolder ? node.name : node.name.replace(/\.md$/i, "");
}

/** Case-insensitive substring filter: keeps a node when its label matches or
 *  any descendant does; surviving folders keep only their matching children. */
function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    const children = filterTree(node.children, q);
    if (children.length > 0 || labelOf(node).toLowerCase().includes(q)) {
      out.push({ ...node, children });
    }
  }
  return out;
}

interface FileTreePanelProps {
  docs: ResourceDocMeta[];
  /** True when the repo is being seeded — renders a friendly placeholder. */
  empty: boolean;
  selectedPath: string | null;
  onFileSelect: (path: string) => void;
  onFolderFocus: (path: string) => void;
  className?: string;
}

export function FileTreePanel({
  docs,
  empty,
  selectedPath,
  onFileSelect,
  onFolderFocus,
  className,
}: FileTreePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Derived from props — rebuilt when an ISR revalidation ships new docs.
  const tree = useMemo(() => buildTree(docs), [docs]);
  // Filter box state. Empty query → the unfiltered tree, rendered as before.
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visibleTree = useMemo(
    () => (q === "" ? tree : filterTree(tree, q)),
    [tree, q],
  );
  // Open folders by path; all folders start closed — the reader opens what
  // they need. Keyed by path, so expansion survives a rebuilt tree.
  const [openPaths, setOpenPaths] = useState<Set<string>>(() => new Set());

  // Graph → tree sync: a new selection opens its ancestors. Adjusted during
  // render (the documented derived-state pattern) rather than in an effect.
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  if (selectedPath !== lastSelected) {
    setLastSelected(selectedPath);
    if (selectedPath) {
      setOpenPaths((prev) => {
        const next = new Set(prev);
        for (const ancestor of ancestorsOf(selectedPath)) next.add(ancestor);
        return next;
      });
    }
  }

  // …and scrolls the row into view (pure DOM side effect, no state).
  useEffect(() => {
    if (!selectedPath) return;
    const frame = requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector(`[data-path="${CSS.escape(selectedPath)}"]`)
        ?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedPath]);

  const toggleFolder = (path: string) => {
    setOpenPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (empty) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">
        The resource library is being prepared — check back soon.
      </p>
    );
  }

  if (tree.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">
        No markdown files found in the resources repo.
      </p>
    );
  }

  return (
    <div ref={panelRef} className={cn("flex flex-col gap-0.5 px-2 py-2", className)}>
      {/* Sticky so the filter stays put while the tree scrolls; the negative
          margin lets its background span the panel's full width. */}
      <div className="sticky top-0 z-10 -mx-2 flex items-center gap-1.5 bg-background/95 px-2 pb-1 backdrop-blur">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
            }}
            placeholder="Filter files…"
            aria-label="Filter files"
          />
          {query !== "" && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear filter"
                onClick={() => setQuery("")}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Collapse all folders"
          disabled={openPaths.size === 0}
          onClick={() => setOpenPaths(new Set())}
        >
          <ListCollapse className="size-4" />
        </Button>
      </div>
      {visibleTree.map((node) => (
        <TreeRow
          key={node.path}
          node={node}
          depth={0}
          openPaths={openPaths}
          forceOpen={q !== ""}
          selectedPath={selectedPath}
          onToggleFolder={toggleFolder}
          onFileSelect={onFileSelect}
          onFolderFocus={onFolderFocus}
        />
      ))}
      {q !== "" && visibleTree.length === 0 && (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          No files match your filter.
        </p>
      )}
    </div>
  );
}

function TreeRow({
  node,
  depth,
  openPaths,
  forceOpen,
  selectedPath,
  onToggleFolder,
  onFileSelect,
  onFolderFocus,
}: {
  node: TreeNode;
  depth: number;
  openPaths: Set<string>;
  /** While filtering, every surviving folder contains a match — render open. */
  forceOpen: boolean;
  selectedPath: string | null;
  onToggleFolder: (path: string) => void;
  onFileSelect: (path: string) => void;
  onFolderFocus: (path: string) => void;
}) {
  if (node.isFolder) {
    const open = forceOpen || openPaths.has(node.path);
    return (
      <div>
        {/* One row, two outcomes: clicking toggles expansion AND zooms the
            graph to this folder's cluster. */}
        <button
          type="button"
          onClick={() => {
            onToggleFolder(node.path);
            onFolderFocus(node.path);
          }}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm font-text text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90",
            )}
          />
          <Folder className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.name}</span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {node.fileCount}
          </span>
        </button>
        {open && (
          <div>
            {node.children.map((child) => (
              <TreeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                openPaths={openPaths}
                forceOpen={forceOpen}
                selectedPath={selectedPath}
                onToggleFolder={onToggleFolder}
                onFileSelect={onFileSelect}
                onFolderFocus={onFolderFocus}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const selected = node.path === selectedPath;

  // A real anchor, not a button: crawlers (and ctrl/cmd/middle-click users)
  // get the reader URL. Plain left-clicks preview in place instead of
  // navigating — the full page is one click away via the preview card.
  return (
    <Link
      href={node.href ?? `/resources/all/${node.path.replace(/\.md$/i, "")}`}
      data-path={node.path}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        onFileSelect(node.path);
      }}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm font-text transition-colors",
        selected
          ? "bg-accent text-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
      style={{ paddingLeft: `${depth * 12 + 8 + 20}px` }}
    >
      <FileText className="size-4 shrink-0 opacity-70" />
      <span className="truncate">{node.name.replace(/\.md$/i, "")}</span>
    </Link>
  );
}
