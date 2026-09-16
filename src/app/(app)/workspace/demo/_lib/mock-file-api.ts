// 15 — in-memory adapter for the demo workspace: same WorkspaceFileApi seam
// as the real REST adapter, backed by the mock contents. sha is a per-path
// counter — enough to exercise the editor's save flow without GitHub.
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import type {
  WorkspaceFileApi,
} from "@/components/workspace/editor/workspace-file-api";
import { mockContents } from "./mock-workspace";

const writeCounts = new Map<string, number>();

export const mockFileApi: WorkspaceFileApi = {
  async read(path) {
    const content = mockContents[path];
    if (content == null) throw new Error(`mock file not found: ${path}`);
    return { path, content, sha: `mock-${writeCounts.get(path) ?? 0}` };
  },

  async write({ path, content }) {
    mockContents[path] = content;
    const count = (writeCounts.get(path) ?? 0) + 1;
    writeCounts.set(path, count);
    return { path, sha: `mock-${count}` };
  },
};
