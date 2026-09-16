"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
// 15 — the demo shares the real editor container + micro-components; only
// the data adapter is a mock (no GitHub involved).
import { UnsavedChangesDialog } from "@/components/workspace/editor/unsaved-changes-dialog";
import {
  WorkspaceEditor,
  type WorkspaceEditorHandle,
} from "@/components/workspace/editor/workspace-editor";
import { mockFileApi } from "../_lib/mock-file-api";
import { AgentPanel } from "./agent-panel";
import { SettingsModal } from "./settings-modal";
import { WorkspaceSidebar } from "./workspace-sidebar";

const PANELS_KEY = "workspace-panels";

const isMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 1023px)").matches;

interface WorkspaceShellProps {
  className?: string;
}

export function WorkspaceShell({ className }: WorkspaceShellProps) {
  const [selectedPath, setSelectedPath] = useState("CONTEXT.md");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agentOpen, setAgentOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [animated, setAnimated] = useState(false);
  // 15 — file-switch guard, same as the real shell (mock adapter, no repo).
  const editorRef = useRef<WorkspaceEditorHandle>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [switchSaving, setSwitchSaving] = useState(false);

  const commitSelect = (path: string) => {
    setSelectedPath(path);
    if (isMobile()) setSidebarOpen(false);
  };
  const handleSelect = (path: string) => {
    if (path !== selectedPath && editorRef.current?.isDirty()) {
      setPendingPath(path);
      return;
    }
    commitSelect(path);
  };
  const handleSwitchSave = async () => {
    if (!pendingPath) return;
    setSwitchSaving(true);
    const saved = (await editorRef.current?.save()) ?? false;
    setSwitchSaving(false);
    setPendingPath(null);
    if (saved) commitSelect(pendingPath);
  };
  const handleSwitchDiscard = () => {
    editorRef.current?.discard();
    if (pendingPath) commitSelect(pendingPath);
    setPendingPath(null);
  };

  // Restore persisted panel state after mount (never in render — SSR mismatch).
  // Runs inside a rAF callback so the restored state paints before
  // transitions are enabled on the following frame.
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
      if (isMobile()) {
        setSidebarOpen(false);
        setAgentOpen(false);
      }
      setHydrated(true);
      requestAnimationFrame(() => setAnimated(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
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
            onSelect={handleSelect}
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

        {/* Center preview */}
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
          <WorkspaceEditor ref={editorRef} path={selectedPath} api={mockFileApi} />
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
          <AgentPanel
            onCollapse={() => setAgentOpen(false)}
            className="max-lg:w-full max-lg:shadow-xl"
          />
        </div>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* 15 — dirty file-switch guard (see handleSelect). */}
      <UnsavedChangesDialog
        open={pendingPath !== null}
        targetPath={pendingPath}
        saving={switchSaving}
        onSave={() => void handleSwitchSave()}
        onDiscard={handleSwitchDiscard}
        onCancel={() => setPendingPath(null)}
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
