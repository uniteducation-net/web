"use client";

// 08 — the IDE-style frame: sidebar | markdown preview | agent panel.
// Receives `repo` (and `user`) from the server guard (04); everything
// interactive lives behind this client boundary.
// Plan: docs/plans/icm-workspace-plan/08-workspace-shell.md

import { useEffect, useState } from "react";
import { MessageSquare, PanelLeftOpen } from "lucide-react";
import type { UIMessage } from "ai";
import type { SessionRepo, SessionUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AgentPanel } from "./agent-panel";
import { MarkdownPreview } from "./markdown-preview";
import { SettingsModal } from "./settings-modal";
import { WorkspaceSidebar } from "./workspace-sidebar";

const PANELS_KEY = "workspace-panels";
const ONBOARDING_KEY = "onboarding-chat";

const isMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 1023px)").matches;

// Appended once when the onboarding conversation slides into the agent panel
// (08 step 6) — continuity from /workspace/start.
const READY_MESSAGE: UIMessage = {
  id: "workspace-ready",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Your workspace is ready — click any file on the left, and ask me anything on the right.",
    },
  ],
};

/** Draft left by onboarding (05). Same light shape check as the draft writer. */
function readOnboardingDraft(): UIMessage[] | null {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UIMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (!parsed.every((m) => Array.isArray(m?.parts))) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface WorkspaceShellProps {
  repo: SessionRepo;
  user: SessionUser;
  className?: string;
}

export function WorkspaceShell({ repo, user, className }: WorkspaceShellProps) {
  // 10 step 4 — default landing document: the workspace root CONTEXT.md
  // (ICM Layer 1, "Where do I go?"). Corrected to the first tree entry on
  // mount if the repo has no root CONTEXT.md.
  const [selectedPath, setSelectedPath] = useState("CONTEXT.md");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agentOpen, setAgentOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [animated, setAnimated] = useState(false);
  // 09 step 3 — refresh signal: the agent panel (11) calls onFilesChanged
  // after writing files; bumping this key makes the sidebar's tree re-fetch.
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  // Onboarding continuity (08 step 6): null until read post-mount; the agent
  // panel mounts only after hydration so useChat initializes with these.
  const [initialAgentMessages, setInitialAgentMessages] = useState<
    UIMessage[] | undefined
  >(undefined);

  // Restore persisted panel state + pick up the onboarding draft after mount
  // (never in render — SSR mismatch). Runs inside a rAF callback so the
  // restored state paints before transitions are enabled on the next frame.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(PANELS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            sidebarOpen?: boolean;
            agentOpen?: boolean;
          };
          if (typeof parsed.sidebarOpen === "boolean")
            setSidebarOpen(parsed.sidebarOpen);
          if (typeof parsed.agentOpen === "boolean")
            setAgentOpen(parsed.agentOpen);
        }
      } catch {
        // corrupt or unavailable storage — keep defaults
      }

      const draft = readOnboardingDraft();
      if (draft) {
        setInitialAgentMessages([...draft, READY_MESSAGE]);
        try {
          localStorage.removeItem(ONBOARDING_KEY); // happens once
        } catch {
          // storage unavailable — harmless, the draft just lingers
        }
      }

      if (isMobile()) {
        setSidebarOpen(false);
        setAgentOpen(false);
      }
      setHydrated(true);
      requestAnimationFrame(() => setAnimated(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Persist panel state (08 step 5) — a teacher who works collapsed stays collapsed.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        PANELS_KEY,
        JSON.stringify({ sidebarOpen, agentOpen }),
      );
    } catch {
      // storage unavailable — panels still work for this session
    }
  }, [sidebarOpen, agentOpen, hydrated]);

  // 10 step 4 — default selection fallback. The tree route is cached 30s
  // server-side, so this second fetch costs nothing after the sidebar's.
  // Only corrects the path if the current one isn't in the repo (e.g. a
  // template without a root CONTEXT.md): never overrides a real selection.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/workspace/tree", { cache: "no-store" });
        if (!res.ok) return; // the sidebar surfaces the failure already
        const entries = (await res.json()) as { path: string }[];
        if (cancelled || entries.length === 0) return;
        setSelectedPath((current) =>
          entries.some((e) => e.path === current)
            ? current
            : (entries.find((e) => e.path === "CONTEXT.md") ?? entries[0])
                .path,
        );
      } catch {
        // offline or hiccup — keep the default; the tree shows the error
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cmd/Ctrl+B toggles the sidebar, Cmd/Ctrl+J toggles the agent panel.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "b") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      } else if (e.key === "j") {
        e.preventDefault();
        setAgentOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "relative grid h-dvh grid-cols-[auto_1fr_auto]",
          !animated && "[&_*]:transition-none",
          className,
        )}
      >
        {/* Sidebar: in-flow grid column on lg, fixed overlay below lg */}
        <div
          className={cn(
            "h-full max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40",
            "transition-[width,transform] duration-200",
            sidebarOpen
              ? "max-lg:translate-x-0"
              : "max-lg:-translate-x-full max-lg:pointer-events-none",
          )}
        >
          <WorkspaceSidebar
            collapsed={!sidebarOpen}
            selectedPath={selectedPath}
            repo={repo}
            user={user}
            refreshKey={treeRefreshKey}
            onSelect={(path) => {
              setSelectedPath(path);
              if (isMobile()) setSidebarOpen(false);
            }}
            onExpand={() => setSidebarOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            className="max-lg:shadow-xl"
          />
        </div>

        {/* Backdrop for mobile overlays */}
        {(sidebarOpen || agentOpen) && (
          <button
            type="button"
            aria-label="Close panels"
            onClick={() => {
              setSidebarOpen(false);
              setAgentOpen(false);
            }}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* Center preview — always visible, takes all remaining space */}
        <main className="relative min-w-0">
          {hydrated && !sidebarOpen && (
            <FloatingButton
              label="Open sidebar (Ctrl+B)"
              className="left-3 top-3"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeftOpen className="size-4" />
            </FloatingButton>
          )}
          {hydrated && !agentOpen && (
            <FloatingButton
              label="Open assistant (Ctrl+J)"
              className="right-3 top-3"
              onClick={() => setAgentOpen(true)}
            >
              <MessageSquare className="size-4" />
            </FloatingButton>
          )}
          <MarkdownPreview
            path={selectedPath}
            repo={repo}
            refreshKey={treeRefreshKey}
          />
        </main>

        {/* Agent panel: in-flow on lg, fixed overlay below lg */}
        <div
          inert={!agentOpen}
          className={cn(
            "h-full overflow-hidden max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-40",
            "transition-[width,transform] duration-200",
            "max-lg:w-[min(380px,90vw)]",
            agentOpen
              ? "lg:w-[380px] max-lg:translate-x-0"
              : "lg:w-0 max-lg:translate-x-full max-lg:pointer-events-none",
          )}
        >
          {hydrated ? (
            <AgentPanel
              initialMessages={initialAgentMessages}
              onCollapse={() => setAgentOpen(false)}
              onFilesChanged={() => setTreeRefreshKey((k) => k + 1)}
              className="max-lg:w-full max-lg:shadow-xl"
            />
          ) : (
            <div className="flex h-full w-[380px] flex-col border-l border-border bg-background max-lg:w-full">
              <div className="flex h-12 shrink-0 items-center border-b border-border px-3">
                <h2 className="font-heading text-sm font-semibold text-secondary">
                  Assistant
                </h2>
              </div>
            </div>
          )}
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        repo={repo}
        user={user}
      />
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
