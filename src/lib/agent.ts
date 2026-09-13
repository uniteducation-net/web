// 11 — the workspace agent: system prompt plus the three server-side tools
// that give the assistant hands on the teacher's repo. Everything runs
// against the GitHub helpers (03) with the session's installation token.
// Plan: docs/plans/icm-workspace-plan/11-agent-panel.md

// Server-only module — never import from client components.

import { tool } from "ai";
import { RequestError } from "octokit";
import { z } from "zod";
import { getTree, readFile, writeFile } from "./github";

/** Hard cap on tool-call rounds per reply (11 step 2) — read→edit→write
 *  chains without runaway loops. */
export const AGENT_MAX_STEPS = 8;

/**
 * System prompt (11 step 3). ICM basics are baked in so the agent can walk
 * the workspace structure without being taught it every time. Kept compact —
 * it is re-sent with every message.
 */
export const AGENT_SYSTEM_PROMPT = `You are the teacher's workspace assistant inside UnitEd. The teacher's workspace lives in a GitHub repository that you access through your tools — nothing exists outside that repo.

How the workspace is organized (ICM):
- Numbered stage folders (01-…, 02-…, …) form a pipeline. Each stage has a CONTEXT.md (the stage's contract: what goes in, what comes out), a references/ folder (inputs and source material), and an output/ folder (what the stage produces).
- Stage N's output is stage N+1's input. A human reviews between stages.
- Voice, tone, and style rules live in _config/ — always respect them when writing teaching materials.

How you work:
- Briefly explain what you are about to do, do it with your tools, then summarize what changed in plain, warm language. The teacher is not technical.
- When the teacher asks you to run a stage, first read that stage's CONTEXT.md with the readFile tool and follow its contract exactly. Write stage results into that stage's output/ folder.
- Never dump raw JSON, file listings as JSON, or base64 into the chat. Describe things in words.
- Every writeFile call needs a clear, human commit message (e.g. "Warm up tone rules" — it becomes the teacher's version history).
- Never delete files, and never overwrite a file without reading it first. If the teacher asks you to delete something, explain that you can't and suggest they do it on GitHub.
- If a tool call fails, say so plainly and suggest the next step — never pretend a change happened.`;

/** Repo-relative path guard for tool inputs — same rules as the file route
 *  (10): no traversal, no absolute paths, no empty segments. */
function isValidPath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 500 &&
    !path.startsWith("/") &&
    !path.endsWith("/") &&
    !path.includes("\\") &&
    !/[\x00-\x1f]/.test(path) &&
    path.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..")
  );
}

export interface WorkspaceToolContext {
  installationId: number;
  owner: string;
  repo: string;
  /** Called after every successful write so the route can notify the client
   *  (11 step 5) that the tree + preview must refresh. */
  onWrite?: (path: string) => void;
}

/**
 * The v1 toolset (11 step 4): list, read, write. No shell, no search, no
 * deployments. `writeFile` fetches the current sha itself when the file
 * already exists (the agent never sees shas).
 */
export function createWorkspaceTools({
  installationId,
  owner,
  repo,
  onWrite,
}: WorkspaceToolContext) {
  return {
    listFiles: tool({
      description:
        "List every file in the teacher's workspace. Use this first when you need to find something or explain what the workspace contains.",
      inputSchema: z.object({}),
      execute: async () => {
        const tree = await getTree(installationId, owner, repo);
        return { files: tree.map((entry) => entry.path) };
      },
    }),

    readFile: tool({
      description:
        "Read the full contents of one file in the workspace. Always read a file before rewriting it.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("Repo-relative path, e.g. 02-script/CONTEXT.md"),
      }),
      execute: async ({ path }) => {
        if (!isValidPath(path)) {
          throw new Error(`Invalid path: ${path}`);
        }
        const file = await readFile(installationId, owner, repo, path);
        return { path, content: file.content };
      },
    }),

    writeFile: tool({
      description:
        "Create a new file or completely rewrite an existing one, committed to the repo with a human-readable message. Read the file first when updating.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("Repo-relative path, e.g. 02-script/output/draft.md"),
        content: z.string().describe("The full new contents of the file."),
        message: z
          .string()
          .describe(
            "Short human-readable commit message, e.g. 'Warm up tone rules'.",
          ),
      }),
      execute: async ({ path, content, message }) => {
        if (!isValidPath(path)) {
          throw new Error(`Invalid path: ${path}`);
        }
        // Fetch the current sha when the file exists — required for updates.
        let sha: string | undefined;
        try {
          sha = (await readFile(installationId, owner, repo, path)).sha;
        } catch (err) {
          // 404 → new file; anything else is a real failure.
          if (!(err instanceof RequestError && err.status === 404)) throw err;
        }
        await writeFile(
          installationId,
          owner,
          repo,
          path,
          content,
          message,
          sha,
        );
        onWrite?.(path);
        return { path, created: !sha };
      },
    }),
  };
}

export type WorkspaceTools = ReturnType<typeof createWorkspaceTools>;
