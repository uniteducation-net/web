"use client";

// Floating tree of the resources repo's markdown files. Data arrives by
// props from the server page (no fetching here). Adapted from the
// workspace's file-tree.tsx — same buildTree (folders-first natural sort)
// and row visuals — with three deltas: folders are zoom targets (row click
// toggles expansion AND focuses the graph cluster), selection syncs from
// graph clicks (ancestors auto-expand + row scrolls into view), and only
// depth-0 folders start open (the repo grows to ~2k files).

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, FileText, Folder } from "lucide-react";
import type { ResourceDocMeta } from "@/lib/resources-graph";
import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isFolder: boolean;
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
  // Open folders by path; depth-0 folders start open. Keyed by path, so
  // expansion survives a rebuilt tree.
  const [openPaths, setOpenPaths] = useState<Set<string>>(
    () => new Set(docs.filter((d) => d.folder !== "" && !d.folder.includes("/")).map((d) => d.folder)),
  );

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
      {tree.map((node) => (
        <TreeRow
          key={node.path}
          node={node}
          depth={0}
          openPaths={openPaths}
          selectedPath={selectedPath}
          onToggleFolder={toggleFolder}
          onFileSelect={onFileSelect}
          onFolderFocus={onFolderFocus}
        />
      ))}
    </div>
  );
}

function TreeRow({
  node,
  depth,
  openPaths,
  selectedPath,
  onToggleFolder,
  onFileSelect,
  onFolderFocus,
}: {
  node: TreeNode;
  depth: number;
  openPaths: Set<string>;
  selectedPath: string | null;
  onToggleFolder: (path: string) => void;
  onFileSelect: (path: string) => void;
  onFolderFocus: (path: string) => void;
}) {
  if (node.isFolder) {
    const open = openPaths.has(node.path);
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

  return (
    <button
      type="button"
      data-path={node.path}
      onClick={() => onFileSelect(node.path)}
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
    </button>
  );
}
