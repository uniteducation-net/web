"use client";

// 09 step 2 — live file tree from the teacher's repo. Fetches the flat
// { path, sha }[] from /api/workspace/tree, groups it into nested folders,
// and renders simple indented rows (no tree library — ICM's depth is
// shallow). Selection is lifted to the shell via onSelect; `refreshKey`
// (bumped by the shell when the agent writes files, 11) re-fetches.
// Plan: docs/plans/icm-workspace-plan/09-file-tree.md

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FileImage, FileText, Folder } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isFolder: boolean;
}

/** Flat paths → nested tree. Folders first, natural sort (ICM's numbered
 *  prefixes like 01-, 02- order correctly). */
function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", children: [], isFolder: true };

  for (const path of paths) {
    const segments = path.split("/");
    let node = root;
    segments.forEach((segment, i) => {
      const segmentPath = segments.slice(0, i + 1).join("/");
      const isFolder = i < segments.length - 1;
      let child = node.children.find(
        (c) => c.name === segment && c.isFolder === isFolder,
      );
      if (!child) {
        child = { name: segment, path: segmentPath, children: [], isFolder };
        node.children.push(child);
      }
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

interface FileTreeProps {
  selectedPath: string;
  onSelect: (path: string) => void;
  /** Bump to re-fetch — the shell bumps it when the agent (11) writes files. */
  refreshKey?: number;
  className?: string;
}

export function FileTree({
  selectedPath,
  onSelect,
  refreshKey = 0,
  className,
}: FileTreeProps) {
  // null = loading (skeleton); the previous tree is kept during a refresh.
  const [paths, setPaths] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/workspace/tree", { cache: "no-store" });
        if (res.status === 401) {
          // Expired session (09 step 6): re-auth is one click and GitHub
          // remembers them — redirect instead of showing a dead screen.
          router.replace("/api/auth/github");
          return; // skeleton stays up until the redirect lands
        }
        if (!res.ok) throw new Error(`tree fetch failed: ${res.status}`);
        const entries = (await res.json()) as { path: string; sha: string }[];
        if (!cancelled) {
          setPaths(entries.map((e) => e.path));
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, router]);

  if (paths === null && !failed) {
    return (
      <div className="flex flex-col gap-2 p-4" aria-hidden>
        {["w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-1/2", "w-2/3"].map(
          (width, i) => (
            <Skeleton key={i} className={cn("h-4", width)} />
          ),
        )}
      </div>
    );
  }

  if (failed) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">
        Couldn&apos;t load your files — collapse and reopen the sidebar to try
        again.
      </p>
    );
  }

  const tree = buildTree(paths ?? []);

  if (tree.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">
        Your workspace is empty — ask the assistant to scaffold it.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-0.5 px-2 py-2", className)}>
      {tree.map((node) => (
        <TreeRow
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function TreeRow({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);

  if (node.isFolder) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
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
        </button>
        {open && (
          <div>
            {node.children.map((child) => (
              <TreeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const selected = node.path === selectedPath;
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(node.name);

  return (
    <button
      type="button"
      onClick={() => onSelect(node.path)}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm font-text transition-colors",
        selected
          ? "bg-accent text-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
      style={{ paddingLeft: `${depth * 12 + 8 + 20}px` }}
    >
      {isImage ? (
        <FileImage className="size-4 shrink-0 opacity-70" />
      ) : (
        <FileText className="size-4 shrink-0 opacity-70" />
      )}
      <span className="truncate">{node.name}</span>
    </button>
  );
}
