"use client";

// 08/09 — left sidebar: live file tree from the teacher's repo (09) + pinned
// bottom zone with Settings and the user menu. In collapsed mode it becomes
// the slim icon rail; account actions never require expanding it.
// Plan: docs/plans/icm-workspace-plan/09-file-tree.md

import {
  ExternalLink,
  LogOut,
  MessageSquareHeart,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { SessionRepo, SessionUser } from "@/lib/session";
import { openTallyPopup } from "@/components/feedback-button";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { FileTree } from "./file-tree";

interface WorkspaceSidebarProps {
  collapsed: boolean;
  selectedPath: string;
  repo: SessionRepo;
  user: SessionUser;
  onSelect: (path: string) => void;
  onExpand: () => void;
  onOpenSettings: () => void;
  /** Bump to re-fetch the tree — the shell bumps it on agent edits (09 step 3). */
  refreshKey: number;
  className?: string;
}

function initials(user: SessionUser): string {
  const source = user.name ?? user.login;
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function repoUrl(repo: SessionRepo): string {
  return `https://github.com/${repo.owner}/${repo.name}`;
}

/** 09 step 4: unpair = clear our session cookie, wipe local drafts, back to onboarding. */
async function logout(router: ReturnType<typeof useRouter>) {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // offline — clear locally anyway; the cookie dies with the session
  }
  try {
    localStorage.clear();
  } catch {
    // storage unavailable — nothing to clear
  }
  router.replace("/workspace/start");
}

export function WorkspaceSidebar({
  collapsed,
  selectedPath,
  repo,
  user,
  refreshKey,
  onSelect,
  onExpand,
  onOpenSettings,
  className,
}: WorkspaceSidebarProps) {
  const router = useRouter();
  const handleLogout = () => logout(router);
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
            <RailButton label="Feedback" onClick={() => void openTallyPopup()}>
              <MessageSquareHeart className="size-4" />
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
                        <AvatarImage
                          src={user.avatarUrl}
                          alt={user.name ?? user.login}
                        />
                        <AvatarFallback className="bg-secondary text-[10px] text-secondary-foreground">
                          {initials(user)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {user.name ?? user.login}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <a href={repoUrl(repo)} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    View repo on GitHub
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
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
          selectedPath={selectedPath}
          onSelect={onSelect}
          refreshKey={refreshKey}
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

        <button
          type="button"
          onClick={() => void openTallyPopup()}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-text hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <MessageSquareHeart className="size-4 text-muted-foreground" />
          Feedback
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Avatar className="size-7">
                <AvatarImage
                  src={user.avatarUrl}
                  alt={user.name ?? user.login}
                />
                <AvatarFallback className="bg-secondary text-[10px] text-secondary-foreground">
                  {initials(user)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-text font-medium">
                  {user.name ?? user.login}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  @{user.login}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem asChild>
              <a href={repoUrl(repo)} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                View repo on GitHub
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
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
