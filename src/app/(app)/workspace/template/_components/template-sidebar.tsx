"use client";

// 17 step 5 — the template workspace's sidebar: the real WorkspaceSidebar's
// frame, minus everything session-coupled (settings, account menu, repo
// link). The file tree renders the local draft via the FileTree's
// files/folders props (no repo fetch). Bottom zone is Feedback only —
// openTallyPopup needs no session.

import {
  ListCollapse,
  MessageSquareHeart,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import { openTallyPopup } from "@/components/feedback-button";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FileTree } from "@/components/workspace/file-tree";

interface TemplateSidebarProps {
  collapsed: boolean;
  selectedPath: string;
  /** The local draft's file paths (rendered instead of a repo fetch). */
  files: string[];
  /** Tree-only folders with no files yet (the step placeholder). */
  folders: string[];
  onSelect: (path: string) => void;
  onExpand: () => void;
  onCollapse: () => void;
  /** Logo click — the shell guards the local draft before navigating away. */
  onLeave: () => void;
  className?: string;
}

export function TemplateSidebar({
  collapsed,
  selectedPath,
  files,
  folders,
  onSelect,
  onExpand,
  onCollapse,
  onLeave,
  className,
}: TemplateSidebarProps) {
  // Bump → every folder row in the tree closes (the "Files" row's button).
  const [collapseSignal, setCollapseSignal] = useState(0);

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            "flex h-full w-12 flex-col items-center gap-1 border-r border-border bg-sidebar py-3 transition-[width] duration-200",
            className,
          )}
        >
          <Logo
            className="mb-1 [&_.logo-text]:text-xs"
            onClick={(e) => {
              e.preventDefault();
              onLeave();
            }}
          />
          <RailButton label="Expand sidebar (Ctrl+B)" onClick={onExpand}>
            <PanelLeftOpen className="size-4" />
          </RailButton>

          <div className="mt-auto flex flex-col items-center gap-1">
            <RailButton label="Feedback" onClick={() => void openTallyPopup()}>
              <MessageSquareHeart className="size-4" />
            </RailButton>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-[260px] flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        className,
      )}
    >
      <div className="flex h-12 items-center gap-2 border-b border-border px-4">
        <Logo
          onClick={(e) => {
            e.preventDefault();
            onLeave();
          }}
        />
        <span className="font-heading text-sm font-semibold">Template</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Collapse sidebar (Ctrl+B)"
          title="Collapse sidebar (Ctrl+B)"
          onClick={onCollapse}
          className="ml-auto"
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between px-4 py-1.5">
        <span className="text-xs text-muted-foreground">Files</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Collapse all folders"
          title="Collapse all folders"
          onClick={() => setCollapseSignal((n) => n + 1)}
        >
          <ListCollapse className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <FileTree
          selectedPath={selectedPath}
          onSelect={onSelect}
          files={files}
          folders={folders}
          collapseSignal={collapseSignal}
        />
      </ScrollArea>

      <div className="mt-auto border-t border-border">
        <button
          type="button"
          onClick={() => void openTallyPopup()}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-text hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <MessageSquareHeart className="size-4 text-muted-foreground" />
          Feedback
        </button>
      </div>
    </div>
  );
}

function RailButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
