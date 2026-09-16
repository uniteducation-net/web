"use client";

// 15 — file loading for the editor: SWR-style cache keyed by path (ported
// from 10-markdown-preview), refreshKey handling that respects dirty state
// (the agent writes via 11), and the "Updated just now" toast signal.
//
// refreshKey policy (plan): a bump means the agent may have written files.
// - Clean editor → drop the cache, re-read, hand the fresh content to the
//   container (onLoaded → setContent on the mounted editor), toast when the
//   sha moved.
// - Dirty editor → never clobber: quietly probe the remote sha; moved →
//   onConflictExternal (the container's banner offers reload/save-anyway).
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import { useEffect, useRef, useState } from "react";
import type { FileData, WorkspaceFileApi } from "./workspace-file-api";

/** Fetch result, tagged with the path it belongs to so a stale response for
 *  a previous selection is never rendered. */
interface FetchResult {
  path: string;
  file: FileData | null;
  failed: boolean;
}

interface UseEditorFileInput {
  api: WorkspaceFileApi;
  path: string;
  isMarkdown: boolean;
  refreshKey: number;
  /** Live dirty flag of the editor — a ref so refresh bumps read it fresh at
   *  event time, never from a stale closure. */
  isDirtyRef: React.RefObject<boolean>;
  /** Fresh content for the CURRENT path arrived while clean — the container
   *  pushes it into the mounted editor via setContent. Not called on plain
   *  path changes (those remount the editor via `key`). */
  onLoaded(file: FileData, meta: { refreshed: boolean; shaMoved: boolean }): void;
  /** Remote sha of the open file moved while dirty. */
  onConflictExternal(): void;
  onUnauthorized(): void;
}

interface UseEditorFileResult {
  file: FileData | null;
  failed: boolean;
  loading: boolean;
  refreshing: boolean;
  /** Agent changed the open file while clean — show the toast. */
  justUpdated: boolean;
  /** Manual refresh (header button; the header disables it while dirty). */
  refresh(): void;
  /** Fresh read bypassing nothing but the flow — for the conflict banner's
   *  "Reload latest". Returns null on failure (banner stays up). */
  reloadLatest(): Promise<FileData | null>;
  /** Sync cache + state after a successful save (new sha). */
  markSaved(file: FileData): void;
}

export function useEditorFile({
  api,
  path,
  isMarkdown,
  refreshKey,
  isDirtyRef,
  onLoaded,
  onConflictExternal,
  onUnauthorized,
}: UseEditorFileInput): UseEditorFileResult {
  const [result, setResult] = useState<FetchResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const cacheRef = useRef(new Map<string, FileData>());
  const handledRefreshKeyRef = useRef(refreshKey);
  // Latest callbacks for the fetch effect — mirrored into a ref so the
  // effect doesn't re-run (and re-fetch) when the parent re-renders.
  const cbRef = useRef({ onLoaded, onConflictExternal, onUnauthorized });
  useEffect(() => {
    cbRef.current = { onLoaded, onConflictExternal, onUnauthorized };
  });

  // Derive the view for the CURRENT path — a result for another path (or
  // none yet) reads as loading, never as stale content.
  const current = result && result.path === path ? result : null;
  const file = current?.file ?? null;
  const failed = current?.failed ?? false;
  const loading = isMarkdown && !current;

  // Fetch on path change; on refreshKey bump apply the dirty-aware policy
  // described above.
  useEffect(() => {
    if (!isMarkdown) return;
    const refresh = handledRefreshKeyRef.current !== refreshKey;
    handledRefreshKeyRef.current = refreshKey;
    // The sha as last shown — a refresh-driven re-read that moves it means
    // someone else (usually the agent) rewrote the open file.
    const prevSha = refresh ? cacheRef.current.get(path)?.sha : undefined;

    let cancelled = false;

    if (refresh && isDirtyRef.current) {
      // Dirty: keep the editor untouched and the stale cache entry (it's the
      // sha a later save still writes against) — just probe.
      (async () => {
        try {
          const fresh = await api.read(path);
          if (cancelled) return;
          if (fresh === "unauthorized") {
            cbRef.current.onUnauthorized();
            return;
          }
          if (prevSha && fresh.sha !== prevSha) cbRef.current.onConflictExternal();
        } catch {
          // offline hiccup — ignore; the next save surfaces a conflict anyway
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    if (refresh) cacheRef.current.clear();
    const cached = refresh ? undefined : cacheRef.current.get(path);

    (async () => {
      // Yield first so cache hits are async too — the current content never
      // flashes, and state updates stay out of the synchronous effect body.
      await Promise.resolve();
      if (cancelled) return;
      if (cached) {
        setResult({ path, file: cached, failed: false });
        return;
      }
      try {
        const data = await api.read(path);
        if (cancelled) return;
        if (data === "unauthorized") {
          cbRef.current.onUnauthorized();
          return;
        }
        cacheRef.current.set(path, data);
        setResult({ path, file: data, failed: false });
        if (refresh) {
          const shaMoved = !!prevSha && prevSha !== data.sha;
          cbRef.current.onLoaded(data, { refreshed: true, shaMoved });
          if (shaMoved) setJustUpdated(true);
        }
      } catch {
        if (!cancelled) setResult({ path, file: null, failed: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, path, refreshKey, isMarkdown, isDirtyRef]);

  // Manual refresh — quiet (no toast): the teacher asked for it.
  const refresh = () => {
    cacheRef.current.delete(path);
    setRefreshing(true);
    (async () => {
      try {
        const data = await api.read(path);
        if (data === "unauthorized") {
          cbRef.current.onUnauthorized();
          return;
        }
        cacheRef.current.set(path, data);
        setResult({ path, file: data, failed: false });
        cbRef.current.onLoaded(data, { refreshed: true, shaMoved: false });
      } catch {
        // Keep showing the last good copy — the teacher loses nothing.
        setResult((prev) =>
          prev && prev.path === path
            ? { ...prev, failed: true }
            : { path, file: null, failed: true },
        );
      } finally {
        setRefreshing(false);
      }
    })();
  };

  const reloadLatest = async (): Promise<FileData | null> => {
    try {
      const data = await api.read(path);
      if (data === "unauthorized") {
        cbRef.current.onUnauthorized();
        return null;
      }
      cacheRef.current.set(path, data);
      setResult({ path, file: data, failed: false });
      return data;
    } catch {
      return null;
    }
  };

  const markSaved = (saved: FileData) => {
    cacheRef.current.set(saved.path, saved);
    setResult({ path: saved.path, file: saved, failed: false });
  };

  // Auto-dismiss the "Updated just now" toast.
  useEffect(() => {
    if (!justUpdated) return;
    const timer = setTimeout(() => setJustUpdated(false), 5000);
    return () => clearTimeout(timer);
  }, [justUpdated]);

  return {
    file,
    failed,
    loading,
    refreshing,
    justUpdated,
    refresh,
    reloadLatest,
    markSaved,
  };
}
