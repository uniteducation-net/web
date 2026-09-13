"use client";

import {
  ExternalLink,
  LogOut,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { mockFiles } from "../_lib/mock-workspace";
import { FileTree } from "./file-tree";

const mockUser = { name: "Ana Rivera", login: "anarivera" };

interface WorkspaceSidebarProps {
  collapsed: boolean;
  selectedPath: string;
  onSelect: (path: string) => void;
  onExpand: () => void;
  onOpenSettings: () => void;
  className?: string;
}

export function WorkspaceSidebar({
  collapsed,
  selectedPath,
  onSelect,
  onExpand,
  onOpenSettings,
  className,
}: WorkspaceSidebarProps) {
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            "flex h-full w-12 flex-col items-center gap-1 border-r border-border bg-sidebar py-3 transition-[width] duration-200",
            className,
          )}
        >
          <Logo className="mb-1 h-4 w-auto" />
          <RailButton label="Expand sidebar (Ctrl+B)" onClick={onExpand}>
            <PanelLeftOpen className="size-4" />
          </RailButton>

          <div className="mt-auto flex flex-col items-center gap-1">
            <RailButton label="Settings" onClick={onOpenSettings}>
              <Settings className="size-4" />
            </RailButton>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Account"
                      className="mt-1 rounded-full"
                    >
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-secondary text-[10px] text-secondary-foreground">
                          AR
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">{mockUser.name}</TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuItem>
                  <ExternalLink className="size-4" />
                  View repo on GitHub
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="size-4" />
                  Unpair GitHub / Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      <div className="flex items-center border-b border-border px-4 py-3">
        <Logo className="h-5 w-auto" />
        <span className="ml-2 font-heading text-sm font-semibold">
          Workspace
        </span>
      </div>

      <ScrollArea className="flex-1">
        <FileTree
          files={mockFiles}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      </ScrollArea>

      <div className="mt-auto border-t border-border">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-text hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="size-4 text-muted-foreground" />
          Settings
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-secondary text-[10px] text-secondary-foreground">
                  AR
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-text font-medium">
                  {mockUser.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  @{mockUser.login}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem>
              <ExternalLink className="size-4" />
              View repo on GitHub
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut className="size-4" />
              Unpair GitHub / Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
