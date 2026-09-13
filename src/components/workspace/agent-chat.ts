// 11 — shared chat contract between /api/agent (server) and the agent panel
// (client): the UIMessage type carrying the repo tools and the transient
// `data-files-changed` signal, plus the empty-state suggestions.
// Plan: docs/plans/icm-workspace-plan/11-agent-panel.md

// Types only — safe to import from both client and server modules.

import type { UIMessage } from "ai";

/** Payload of the transient `data-files-changed` part (11 step 5): emitted
 *  server-side after every writeFile tool result so the panel can refresh
 *  the tree (09) and preview (10). Transient — never persisted in parts. */
export interface FilesChangedSignal {
  paths: string[];
}

/** Payload of the transient `data-usage` part (12 step 6): emitted server-side
 *  after a gateway (free-tier) response so the panel can report token usage to
 *  /api/settings — the `fu` counter cookie can't be set mid-stream. Transient —
 *  never persisted in parts. */
export interface UsageSignal {
  totalTokens: number;
}

/**
 * UI-side view of the agent's toolset (the server-side definitions live in
 * src/lib/agent.ts and must stay server-only — they hold GitHub credentials).
 * Used to type tool parts in the chat; keep inputs/outputs in sync.
 */
export type AgentUITools = {
  listFiles: {
    input: Record<string, never>;
    output: { files: string[] } | undefined;
  };
  readFile: {
    input: { path: string };
    output: { path: string; content: string } | undefined;
  };
  writeFile: {
    input: { path: string; content: string; message: string };
    output: { path: string; created: boolean } | undefined;
  };
};

export type AgentUIMessage = UIMessage<
  unknown,
  { "files-changed": FilesChangedSignal; usage: UsageSignal },
  AgentUITools
>;

/** Empty-state suggestions (11 step 9) — they teach the mental model better
 *  than any onboarding doc. */
export const AGENT_SUGGESTIONS = [
  "Run stage 01 with my next lesson topic",
  "Make my tone rules warmer",
  "Explain what's in my workspace",
];
