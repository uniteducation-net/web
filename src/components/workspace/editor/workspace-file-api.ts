// 15 — data seam for the workspace editor. The container only knows this
// interface; the real workspace passes `workspaceFileApi` (the existing
// route handlers from 10/11), the demo passes an in-memory mock
// (demo/_lib/mock-file-api.ts). No "use client" — pure fetch module,
// imported by client components only.
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

export interface FileData {
  path: string;
  content: string;
  /** Blob sha from the last read — the write path needs it for optimistic
   *  concurrency (PUT 409s on a stale sha). */
  sha: string;
}

export type WriteResult =
  | { path: string; sha: string }
  | "sha_mismatch"
  | "unauthorized";

export interface WorkspaceFileApi {
  read(path: string): Promise<FileData | "unauthorized">;
  write(input: {
    path: string;
    content: string;
    sha: string;
  }): Promise<WriteResult>;
}

/** Real adapter: GET/PUT /api/workspace/file (session cookie auth). */
export const workspaceFileApi: WorkspaceFileApi = {
  async read(path) {
    const res = await fetch(
      `/api/workspace/file?path=${encodeURIComponent(path)}`,
      { cache: "no-store" },
    );
    if (res.status === 401) return "unauthorized";
    if (!res.ok) throw new Error(`file fetch failed: ${res.status}`);
    return (await res.json()) as FileData;
  },

  async write({ path, content, sha }) {
    const res = await fetch("/api/workspace/file", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        content,
        sha,
        message: `Edit ${path} in the workspace editor`,
      }),
    });
    if (res.status === 401) return "unauthorized";
    if (res.status === 409) return "sha_mismatch";
    if (!res.ok) throw new Error(`file write failed: ${res.status}`);
    return (await res.json()) as { path: string; sha: string };
  },
};
