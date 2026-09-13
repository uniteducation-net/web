"use client";

import { useState } from "react";
import {
  ChevronRight,
  FileImage,
  FileText,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isFolder: boolean;
}

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
  files: string[];
  selectedPath: string;
  onSelect: (path: string) => void;
  className?: string;
}

export function FileTree({
  files,
  selectedPath,
  onSelect,
  className,
}: FileTreeProps) {
  const tree = buildTree(files);

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
