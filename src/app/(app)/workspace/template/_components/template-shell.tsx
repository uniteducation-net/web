"use client";

// 17 — the anonymous template workspace: the real editor over a localStorage
// draft, open without login. The deterministic seed is byte-identical to what
// provisioning commits (shared builders in lib/template-workspace.ts); a
// completed onboarding chat fills the profile and triggers one anonymous
// step-1 generation; logging in converts the draft WYSIWYG via the create
// route's files payload. Lean sibling of workspace-shell.tsx — no agent
// panel, settings, or repo chrome (all session-coupled).
// Plan: docs/plans/icm-workspace-plan/17-template-workspace.md

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftOpen } from "lucide-react";
import type { TeacherProfile } from "@/lib/onboarding"; // type-only
import { START_HERE_MAIN } from "@/lib/workspace-paths";
import {
  EMPTY_TEMPLATE_PROFILE,
  STEP1_PLACEHOLDER_DIR,
  STEP_FILE_PATH,
  buildTemplateFiles,
} from "@/lib/template-workspace";
import { draftProfile, readOnboardingDraft } from "@/lib/onboarding-draft";
import { describeCreateError } from "@/lib/create-error";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LeaveWorkspaceDialog } from "@/components/workspace/editor/leave-workspace-dialog";
import { UnsavedChangesDialog } from "@/components/workspace/editor/unsaved-changes-dialog";
import {
  WorkspaceEditor,
  type WorkspaceEditorHandle,
} from "@/components/workspace/editor/workspace-editor";
import {
  clearTemplateEnvelope,
  createTemplateStore,
  loadTemplateEnvelope,
  type TemplateFileEntry,
  type TemplateStoreState,
} from "../_lib/local-file-api";
import { LeaveTemplateDialog } from "./leave-template-dialog";
import {
  TemplateBanner,
  type TemplateBannerError,
} from "./template-banner";
import { TemplateSidebar } from "./template-sidebar";

const PANELS_KEY = "workspace-panels"; // shared with the real shell (sidebarOpen only)
/** Logo click destination — the public site's home (no locale in (app)). */
const LEAVE_HREF = "/en";

const isMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 1023px)").matches;

function seedEntries(
  files: { path: string; content: string }[],
): Record<string, TemplateFileEntry> {
  return Object.fromEntries(
    files.map((f) => [
      f.path,
      { content: f.content, savedAt: new Date().toISOString() },
    ]),
  );
}

interface TemplateShellProps {
  /** Server-computed in page.tsx — drives the banner CTA + the close warning. */
  authState: "anonymous" | "no-repo" | "has-repo";
  className?: string;
}

export function TemplateShell({ authState, className }: TemplateShellProps) {
  const router = useRouter();
  // The draft store lives outside React (created once) so the editor's
  // closures always read current data; storeState mirrors it for rendering.
  const [store] = useState(() =>
    createTemplateStore(seedEntries(buildTemplateFiles(null))),
  );
  const [storeState, setStoreState] = useState<TemplateStoreState>(() =>
    store.getState(),
  );
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [selectedPath, setSelectedPath] = useState(START_HERE_MAIN);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [animated, setAnimated] = useState(false);
  // 15 — file-switch guard (same contract as the real shell).
  const editorRef = useRef<WorkspaceEditorHandle>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [switchSaving, setSwitchSaving] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveSaving, setLeaveSaving] = useState(false);
  // Anonymous leave with content → the keep-your-draft dialog.
  const [draftLeaveOpen, setDraftLeaveOpen] = useState(false);
  // Create conversion (no-repo banner CTA).
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<TemplateBannerError | null>(
    null,
  );

  const { files, touched, step1ProfileHash } = storeState;
  const stepFilesExist = Object.keys(files).some((p) =>
    STEP_FILE_PATH.test(p),
  );
  // Mirrored every render (the editor's saveRef pattern) so the beforeunload
  // handler always reads current state, never a stale closure.
  const hasContentRef = useRef(false);
  useEffect(() => {
    hasContentRef.current = profile !== null || touched || stepFilesExist;
  });
  const step1RequestedRef = useRef(false);

  // The render mirror: store mutations (editor writes, step-1 merge, seed)
  // push fresh state into React.
  useEffect(() => {
    store.setOnChange(setStoreState);
    return () => store.setOnChange(null);
  }, [store]);

  // Hydration: panels + onboarding profile + the stored envelope (never in
  // render — SSR mismatch). The onboarding draft is only READ here — the
  // real WorkspaceShell consumes (removes) it after login provisioning.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(PANELS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { sidebarOpen?: boolean };
          if (typeof parsed.sidebarOpen === "boolean") {
            setSidebarOpen(parsed.sidebarOpen);
          }
        }
      } catch {
        // corrupt or unavailable storage — keep defaults
      }

      const p = draftProfile(readOnboardingDraft() ?? []);
      setProfile(p);

      const envelope = loadTemplateEnvelope();
      // Envelope wins over a re-seed: the teacher's local draft is never
      // clobbered by a newer chat profile (documented in 17).
      if (envelope && Object.keys(envelope.files).length > 0) {
        store.adopt(envelope);
      } else {
        store.reseed(seedEntries(buildTemplateFiles(p)));
      }
      // Selection guard: a corrupt/foreign envelope may lack Start Here.
      const current = store.getState().files;
      if (!current[START_HERE_MAIN]) {
        const first = Object.keys(current).sort()[0];
        if (first) setSelectedPath(first);
      }

      if (isMobile()) setSidebarOpen(false);
      setHydrated(true);
      requestAnimationFrame(() => setAnimated(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [store]);

  // Step-1 generation (17 step 4): one anonymous call per profile. Files OR a
  // gated-empty response are terminal for that profile (hash recorded);
  // HTTP/network failures leave the hash unset → retried on next load.
  useEffect(() => {
    if (!hydrated || !profile) return;
    const hash = JSON.stringify(profile);
    if (
      stepFilesExist ||
      step1ProfileHash === hash ||
      step1RequestedRef.current
    ) {
      return;
    }
    step1RequestedRef.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/workspace/template-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });
        if (!res.ok) return; // transient — retried on next load
        const data = (await res.json()) as {
          files?: { path: string; content: string }[];
        };
        if (!Array.isArray(data.files)) return;
        if (data.files.length > 0) store.addFiles(data.files);
        // Terminal for this profile — files OR a gated empty answer.
        store.setStep1ProfileHash(hash);
      } catch {
        // offline — retried on next load
      }
    })();
  }, [hydrated, profile, files, step1ProfileHash, stepFilesExist, store]);

  // Persist panel state (08 step 5 parity).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(PANELS_KEY, JSON.stringify({ sidebarOpen }));
    } catch {
      // storage unavailable — panels still work for this session
    }
  }, [sidebarOpen, hydrated]);

  // Anonymous close warning (17 step 6): the draft is browser-only — nudge
  // before the tab closes when there's anything worth keeping. Logged-in
  // visitors never get the prompt (their path to keeping it is the banner).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (authState === "anonymous" && hasContentRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [authState]);

  // Cmd/Ctrl+B toggles the sidebar (mirrors the real shell).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "b") return;
      e.preventDefault();
      setSidebarOpen((v) => !v);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // 15 — selection commits immediately when the editor is clean; with
  // unsaved changes the target waits in pendingPath for the dialog.
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

  // Logo click → back to the website: dirty editor → save/discard dialog;
  // anonymous with content → keep-your-draft dialog; otherwise just go.
  const handleLeaveRequest = () => {
    if (editorRef.current?.isDirty()) {
      setLeaveOpen(true);
      return;
    }
    if (authState === "anonymous" && hasContentRef.current) {
      setDraftLeaveOpen(true);
      return;
    }
    router.push(LEAVE_HREF);
  };
  const handleLeaveSave = async () => {
    setLeaveSaving(true);
    const saved = (await editorRef.current?.save()) ?? false;
    setLeaveSaving(false);
    setLeaveOpen(false);
    if (saved) router.push(LEAVE_HREF);
  };
  const handleLeaveDiscard = () => {
    editorRef.current?.discard();
    setLeaveOpen(false);
    router.push(LEAVE_HREF);
  };

  // WYSIWYG conversion (17 step 7): the whole local draft becomes the create
  // payload's files — the repo lands exactly what the teacher sees here.
  const createWorkspace = async () => {
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile ?? EMPTY_TEMPLATE_PROFILE,
          files: Object.entries(store.getState().files).map(
            ([path, { content }]) => ({ path, content }),
          ),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        fixUrl?: string;
      };

      if (res.status === 409 && data.fixUrl) {
        // Installation coverage fix (07 step 5) — one click, then retry.
        window.location.href = data.fixUrl;
        return;
      }
      if (!res.ok) {
        setCreateError(describeCreateError(data));
        return;
      }

      // The draft is safely in the repo — drop the local copy and hard-nav
      // (deliberate full reload: stale router cache, same as onboarding).
      clearTemplateEnvelope();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/workspace";
    } catch {
      setCreateError({
        message:
          "Couldn't reach the server — check your connection and try again.",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "relative grid h-dvh grid-cols-[auto_1fr] grid-rows-[minmax(0,1fr)]",
          !animated && "[&_*]:transition-none",
          className,
        )}
      >
        {/* Sidebar: in-flow grid column on lg, fixed overlay below lg */}
        <div
          className={cn(
            "h-full min-h-0 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40",
            "transition-[width,transform] duration-200",
            sidebarOpen
              ? "max-lg:translate-x-0"
              : "max-lg:-translate-x-full max-lg:pointer-events-none",
          )}
        >
          <TemplateSidebar
            collapsed={!sidebarOpen}
            selectedPath={selectedPath}
            files={Object.keys(files)}
            folders={stepFilesExist ? [] : [STEP1_PLACEHOLDER_DIR]}
            onSelect={handleSelect}
            onExpand={() => setSidebarOpen(true)}
            onCollapse={() => setSidebarOpen(false)}
            onLeave={handleLeaveRequest}
            className="max-lg:shadow-xl"
          />
        </div>

        {/* Backdrop for the mobile overlay */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* Center column: banner + editor */}
        <main className="relative flex min-h-0 min-w-0 flex-col">
          {hydrated && !sidebarOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Open sidebar (Ctrl+B)"
                  onClick={() => setSidebarOpen(true)}
                  className="absolute left-3 top-3 z-20 bg-background shadow-sm"
                >
                  <PanelLeftOpen className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open sidebar (Ctrl+B)</TooltipContent>
            </Tooltip>
          )}
          <TemplateBanner
            authState={authState}
            creating={creating}
            error={createError}
            onCreate={() => void createWorkspace()}
          />
          <div className="min-h-0 flex-1">
            {/* Mount only after hydration: the editor reads its file on mount,
                so it must see the ADOPTED envelope / profiled seed — a pre-
                hydration mount would show the pristine seed forever (found in
                e2e: stale "Welcome, Teacher!" after a profiled reseed). */}
            {hydrated && (
              <WorkspaceEditor
                ref={editorRef}
                path={selectedPath}
                api={store.api}
              />
            )}
          </div>
        </main>
      </div>

      {/* 15 — dirty file-switch guard. */}
      <UnsavedChangesDialog
        open={pendingPath !== null}
        targetPath={pendingPath}
        saving={switchSaving}
        onSave={() => void handleSwitchSave()}
        onDiscard={handleSwitchDiscard}
        onCancel={() => setPendingPath(null)}
      />

      {/* Dirty leave guard (logo click → back to the website). */}
      <LeaveWorkspaceDialog
        open={leaveOpen}
        path={selectedPath}
        saving={leaveSaving}
        onSave={() => void handleLeaveSave()}
        onLeave={handleLeaveDiscard}
        onStay={() => setLeaveOpen(false)}
      />

      {/* Anonymous leave with a kept draft — the login nudge. */}
      <LeaveTemplateDialog
        open={draftLeaveOpen}
        onStay={() => setDraftLeaveOpen(false)}
      />
    </TooltipProvider>
  );
}
