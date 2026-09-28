// 17 step 3 — the template workspace's local draft store: a WorkspaceFileApi
// adapter (the demo's mock-file-api.ts precedent) over a localStorage-backed
// envelope, owned outside React so the editor's closures always read current
// data. The shell mirrors state for rendering via setOnChange. Pure module.
// Plan: docs/plans/icm-workspace-plan/17-template-workspace.md

import type { WorkspaceFileApi } from "@/components/workspace/editor/workspace-file-api";

export const TEMPLATE_STORAGE_KEY = "workspace-template-v1";

export interface TemplateFileEntry {
  content: string;
  /** ISO timestamp of the last write (informational, never read for logic). */
  savedAt: string;
}

export interface TemplateEnvelope {
  version: 1;
  /** Any edit ever landed — feeds the anonymous close warning (17 step 6). */
  touched: boolean;
  /** JSON of the profile the step-1 call resolved for (files OR a terminal
   *  empty answer). Null = never resolved — retry on next load. */
  step1ProfileHash: string | null;
  files: Record<string, TemplateFileEntry>;
}

/** null on absent / corrupt / foreign-version / unavailable storage. */
export function loadTemplateEnvelope(): TemplateEnvelope | null {
  try {
    const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TemplateEnvelope;
    if (parsed?.version !== 1 || typeof parsed.files !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** try/catch inside — quota or blocked storage degrades to session-only. */
function saveTemplateEnvelope(envelope: TemplateEnvelope): void {
  try {
    window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // storage full/unavailable — the draft keeps working for this session
  }
}

export function clearTemplateEnvelope(): void {
  try {
    window.localStorage.removeItem(TEMPLATE_STORAGE_KEY);
  } catch {
    // storage unavailable — the draft just lingers
  }
}

export interface TemplateStoreState {
  files: Record<string, TemplateFileEntry>;
  touched: boolean;
  step1ProfileHash: string | null;
}

export interface TemplateStore {
  /** The WorkspaceFileApi seam for the editor. sha is a per-path counter
   *  (`local-N`): single-user local store, so writes never sha-mismatch in
   *  practice, and "unauthorized" is never returned (the editor's reauth
   *  redirect must never fire in template mode). */
  api: WorkspaceFileApi;
  /** Current state snapshot — the object identity changes on every mutation,
   *  so it can feed React state directly. */
  getState(): TemplateStoreState;
  /** Adopt a stored envelope on load (no persist — it's already stored). */
  adopt(envelope: TemplateEnvelope): void;
  /** (Re)seed from freshly built template files. */
  reseed(files: Record<string, TemplateFileEntry>): void;
  /** Merge generated step files into the draft. */
  addFiles(files: { path: string; content: string }[]): void;
  /** Record the profile the step-1 call resolved for (terminal). */
  setStep1ProfileHash(hash: string): void;
  /** The shell's render mirror — called with the new state after mutations. */
  setOnChange(listener: ((state: TemplateStoreState) => void) | null): void;
}

export function createTemplateStore(
  seed: Record<string, TemplateFileEntry>,
): TemplateStore {
  let state: TemplateStoreState = {
    files: seed,
    touched: false,
    step1ProfileHash: null,
  };
  let onChange: ((state: TemplateStoreState) => void) | null = null;
  const writeCounts = new Map<string, number>();

  const commit = (next: TemplateStoreState, persist = true) => {
    state = next;
    if (persist) {
      saveTemplateEnvelope({
        version: 1,
        touched: next.touched,
        step1ProfileHash: next.step1ProfileHash,
        files: next.files,
      });
    }
    onChange?.(state);
  };

  return {
    api: {
      async read(path) {
        const entry = state.files[path];
        if (!entry) throw new Error(`template file not found: ${path}`);
        return {
          path,
          content: entry.content,
          sha: `local-${writeCounts.get(path) ?? 0}`,
        };
      },

      async write({ path, content }) {
        commit({
          ...state,
          touched: true,
          files: {
            ...state.files,
            [path]: { content, savedAt: new Date().toISOString() },
          },
        });
        const count = (writeCounts.get(path) ?? 0) + 1;
        writeCounts.set(path, count);
        return { path, sha: `local-${count}` };
      },
    },

    getState: () => state,

    adopt(envelope) {
      commit(
        {
          files: envelope.files,
          touched: envelope.touched,
          step1ProfileHash: envelope.step1ProfileHash,
        },
        false,
      );
    },

    reseed(files) {
      commit({ ...state, files });
    },

    addFiles(files) {
      const stamp = new Date().toISOString();
      commit({
        ...state,
        files: {
          ...state.files,
          ...Object.fromEntries(
            files.map((f) => [f.path, { content: f.content, savedAt: stamp }]),
          ),
        },
      });
    },

    setStep1ProfileHash(hash) {
      commit({ ...state, step1ProfileHash: hash });
    },

    setOnChange(listener) {
      onChange = listener;
    },
  };
}
