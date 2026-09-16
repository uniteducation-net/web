"use client";

// 15 — center column: the Notion-style editor container. Owns the file
// lifecycle (use-editor-file), dirty tracking against a NORMALIZED baseline
// (plan C1: capture `getMarkdown()` on create — never compare against the
// raw file bytes, markdown round-trips are not byte-stable), saving through
// the WorkspaceFileApi seam, conflict resolution, and the imperative handle
// the shell uses to guard file switching. The heavy Tiptap chunk is
// lazy-loaded via next/dynamic with ssr:false — allowed inside Client
// Components per the Next lazy-loading guide.
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { Sparkles } from "lucide-react";
import type { SessionRepo } from "@/lib/session";
import { cn } from "@/lib/utils";
import { EditorConflictBanner } from "./editor-conflict-banner";
import { EditorHeader } from "./editor-header";
import {
  EditorErrorCard,
  EditorSkeleton,
  NonMarkdownNotice,
} from "./editor-states";
import { useEditorFile } from "./use-editor-file";
import type { FileData, WorkspaceFileApi } from "./workspace-file-api";

const TiptapEditor = dynamic(
  () => import("./tiptap-editor").then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

/** Dirty comparison ignores trailing whitespace: StarterKit's TrailingNode
 *  can add an empty trailing paragraph after undo/setContent, which
 *  serializes to meaningless trailing blank lines — without this the file
 *  would read dirty forever after a Ctrl+Z round-trip. */
const normalizeMarkdown = (md: string) => md.trimEnd();

/** What the shell needs to guard file switching (15 step 3). */
export interface WorkspaceEditorHandle {
  /** Reads a ref — fresh at click time, never a stale state closure. */
  isDirty(): boolean;
  /** Writes the buffer; resolves false when the save didn't land
   *  (409/401/network) — the banner or error pill explains why. */
  save(): Promise<boolean>;
  /** Restores the last-saved baseline markdown. */
  discard(): void;
}

interface WorkspaceEditorProps {
  path: string;
  api: WorkspaceFileApi;
  /** Undefined in the demo — the GitHub deep link is hidden then. */
  repo?: SessionRepo;
  /** Bump = the agent (11) wrote files. */
  refreshKey?: number;
  ref?: React.Ref<WorkspaceEditorHandle>;
  className?: string;
}

export function WorkspaceEditor({
  path,
  api,
  repo,
  refreshKey = 0,
  ref,
  className,
}: WorkspaceEditorProps) {
  const router = useRouter();
  const isMarkdown = path.toLowerCase().endsWith(".md");
  const githubUrl = repo
    ? `https://github.com/${repo.owner}/${repo.name}/blob/HEAD/${path}`
    : undefined;

  const editorInstanceRef = useRef<Editor | null>(null);
  const baselineRef = useRef<string | null>(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{
    reason: "sha_mismatch" | "external";
  } | null>(null);
  const [conflictBusy, setConflictBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Push fresh content into the MOUNTED editor (agent wrote while clean, a
  // manual refresh, or the banner's "Reload latest"). Resets the baseline so
  // the file reads clean afterwards.
  const applyExternal = (data: FileData) => {
    const ed = editorInstanceRef.current;
    if (!ed) return;
    ed.commands.setContent(data.content, { contentType: "markdown" });
    baselineRef.current = normalizeMarkdown(ed.getMarkdown());
    dirtyRef.current = false;
    setDirty(false);
    setConflict(null);
  };

  const {
    file,
    failed,
    loading,
    refreshing,
    justUpdated,
    refresh,
    reloadLatest,
    markSaved,
  } = useEditorFile({
    api,
    path,
    isMarkdown,
    refreshKey,
    isDirtyRef: dirtyRef,
    onLoaded: (data, meta) => {
      if (meta.refreshed) applyExternal(data);
    },
    onConflictExternal: () => setConflict({ reason: "external" }),
    onUnauthorized: () => router.replace("/api/auth/github"),
  });

  // New file → editing state resets via the remount's onCreate (onBaseline
  // below). No reset effect needed: the shell's dirty guard means a switch
  // only happens while clean, and conflict/saveError both imply dirty, so
  // they can never be showing at a switch. (The one bypass — workspace repo
  // switch while dirty — is a documented limitation in the plan doc.)

  // Auto-dismiss the save-error pill (same 5s rhythm as the toast).
  useEffect(() => {
    if (!saveError) return;
    const timer = setTimeout(() => setSaveError(null), 5000);
    return () => clearTimeout(timer);
  }, [saveError]);

  const save = async (): Promise<boolean> => {
    const ed = editorInstanceRef.current;
    if (!ed || !file) return false;
    // Nothing to write — report success so a pending navigation proceeds.
    if (!dirtyRef.current) return true;
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    try {
      const markdown = ed.getMarkdown();
      const res = await api.write({
        path: file.path,
        content: markdown,
        sha: file.sha,
      });
      if (res === "unauthorized") {
        router.replace("/api/auth/github");
        return false;
      }
      if (res === "sha_mismatch") {
        setConflict({ reason: "sha_mismatch" });
        return false;
      }
      markSaved({ path: file.path, content: markdown, sha: res.sha });
      baselineRef.current = normalizeMarkdown(markdown);
      dirtyRef.current = false;
      setDirty(false);
      setConflict(null);
      return true;
    } catch {
      setSaveError("Couldn't save — try again.");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const discard = () => {
    const ed = editorInstanceRef.current;
    if (!ed || baselineRef.current == null) return;
    // Baseline came from getMarkdown(), so parsing it back yields the same
    // doc — onUpdate recomputes clean; the explicit resets are belt & braces.
    ed.commands.setContent(baselineRef.current, { contentType: "markdown" });
    dirtyRef.current = false;
    setDirty(false);
    setConflict(null);
  };

  // Latest-save mirror for the stable imperative handle + the Cmd/Ctrl+S
  // listener (both must call the CURRENT save, not a stale closure).
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  // No deps array → the handle is recreated every render and never stale.
  useImperativeHandle(ref, () => ({
    isDirty: () => dirtyRef.current,
    save: () => saveRef.current(),
    discard,
  }));

  // Cmd/Ctrl+S saves (mirrors the shell's Cmd+B/J listener).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "s") return;
      e.preventDefault();
      void saveRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleReloadLatest = async () => {
    setConflictBusy(true);
    const fresh = await reloadLatest();
    setConflictBusy(false);
    if (fresh) applyExternal(fresh);
  };

  const handleSaveAnyway = async () => {
    const ed = editorInstanceRef.current;
    if (!ed) return;
    setConflictBusy(true);
    try {
      // Re-read purely for the fresh sha, then overwrite the remote change.
      const fresh = await api.read(path);
      if (fresh === "unauthorized") {
        router.replace("/api/auth/github");
        return;
      }
      const markdown = ed.getMarkdown();
      const res = await api.write({ path, content: markdown, sha: fresh.sha });
      if (res === "unauthorized") {
        router.replace("/api/auth/github");
        return;
      }
      if (res === "sha_mismatch") return; // raced again — keep the banner up
      markSaved({ path, content: markdown, sha: res.sha });
      baselineRef.current = normalizeMarkdown(markdown);
      dirtyRef.current = false;
      setDirty(false);
      setConflict(null);
    } catch {
      setSaveError("Couldn't save — try again.");
    } finally {
      setConflictBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "relative flex h-full min-w-0 flex-col bg-background",
        className,
      )}
    >
      <EditorHeader
        path={path}
        githubUrl={githubUrl}
        isMarkdown={isMarkdown}
        dirty={dirty}
        saving={saving}
        loading={loading}
        refreshing={refreshing}
        onSave={() => void saveRef.current()}
        onDiscard={discard}
        onRefresh={refresh}
      />

      {!isMarkdown ? (
        <NonMarkdownNotice path={path} githubUrl={githubUrl} />
      ) : loading ? (
        <EditorSkeleton />
      ) : failed && !file ? (
        <EditorErrorCard onRetry={refresh} githubUrl={githubUrl} />
      ) : file ? (
        // key={path} remounts per file — no cross-file state bleed, and the
        // fresh mount parses initialMarkdown once.
        <TiptapEditor
          key={path}
          initialMarkdown={file.content}
          onBaseline={(md) => {
            baselineRef.current = normalizeMarkdown(md);
            dirtyRef.current = false;
            setDirty(false);
          }}
          onUpdate={(md) => {
            const isDirty = normalizeMarkdown(md) !== baselineRef.current;
            dirtyRef.current = isDirty;
            setDirty(isDirty);
          }}
          onEditorInit={(ed) => {
            editorInstanceRef.current = ed;
          }}
        />
      ) : null}

      {/* The agent rewrote the open file while clean (ported from 10). */}
      {justUpdated && !conflict && (
        <div
          role="status"
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-secondary shadow-sm"
        >
          <Sparkles className="size-3.5 text-muted-foreground" />
          Updated just now
        </div>
      )}

      {conflict && (
        <EditorConflictBanner
          reason={conflict.reason}
          busy={conflictBusy}
          onReloadLatest={() => void handleReloadLatest()}
          onSaveAnyway={() => void handleSaveAnyway()}
        />
      )}

      {saveError && (
        <div
          role="alert"
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs text-destructive shadow-sm"
        >
          {saveError}
        </div>
      )}
    </div>
  );
}
