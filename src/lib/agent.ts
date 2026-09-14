// 11 — the workspace agent: system prompt plus the three server-side tools
// that give the assistant hands on the teacher's repo. Everything runs
// against the GitHub helpers (03) with the session's installation token.
// Plan: docs/plans/icm-workspace-plan/11-agent-panel.md

// Server-only module — never import from client components.

import { tool } from "ai";
import { RequestError } from "octokit";
import { z } from "zod";
import { getTree, readFile, writeFile } from "./github";
import {
  getPublicFile,
  icmReferenceRepoCoords,
} from "./public-github";
import { getResourcesIndex, type ResourceSummary } from "./resources";

/** Hard cap on tool-call rounds per reply (11 step 2) — read→edit→write
 *  chains without runaway loops. */
export const AGENT_MAX_STEPS = 8;

/**
 * System prompt (11 step 3). ICM basics are baked in so the agent can walk
 * the workspace structure without being taught it every time. Kept compact —
 * it is re-sent with every message.
 */
export const AGENT_SYSTEM_PROMPT = `You are the teacher's workspace assistant inside UnitEd. The teacher's workspace lives in a GitHub repository that you access through your tools — nothing exists outside that repo.

How the workspace is organized:
- The workspace starts small on purpose: 00-Profile/ (who the teacher is — read it first whenever you personalize anything) and 01-Start Here/ (their orientation). Everything else is built together with the teacher, one step at a time.
- When the teacher asks for the next piece of work (a lesson plan, a unit outline, a rubric, …), create exactly ONE numbered step folder for that request, continuing the top-level numbering: "02-Step 1 - <Short Title>/", then "03-Step 2 - <Short Title>/", and so on. Each step folder gets a CONTEXT.md — its contract: inputs, process, output, and the human check before the result is used — plus the single output file it produces. One step per request; never scaffold steps 2-5 in advance.
- Before generating a step, call searchResources with the teacher's subject or topic. When resources match, cite them by name with [[Title]] wikilinks in the files you write and link to them.
- For a non-trivial step you may call readIcmReference to consult the method guide while structuring the folder and its contract.
- Conventions to keep: one folder, one job; every folder's contract is explicit in its CONTEXT.md; reference material stays stable while new outputs become new files. Never mention "ICM" to the teacher — call it "your workspace structure", in plain, warm language.

How you work:
- Briefly explain what you are about to do, do it with your tools, then summarize what changed in plain, warm language. The teacher is not technical.
- Never dump raw JSON, file listings as JSON, or base64 into the chat. Describe things in words.
- Every writeFile call needs a clear, human commit message (e.g. "Draft lesson plan on fractions" — it becomes the teacher's version history).
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

// ─── Resource search (final-adjustments step 7) ─────────────────────────

/** Filler words that would make every resource match every query. Kept to
 *  pure function words — domain terms (lesson, planning, classroom, …) are
 *  discriminative inside a small teaching-resources library, not noise. */
const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "about", "into",
  "your", "their", "them", "they", "you", "are", "was", "were", "have",
  "has", "had", "not", "but", "all", "any", "can", "how", "what", "when",
  "make", "create", "write",
]);

/** Lowercase word tokens, minus stop words and very short fragments. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));
}

/**
 * Lightweight local keyword-overlap rank — deliberately no LLM call: the
 * query shares vocabulary with curated titles/summaries, so shared terms
 * (title hits weighted over summary hits) are a good enough signal for a
 * ~25-entry index. Returns up to `limit` matches, best first.
 */
function rankResources(
  query: string,
  index: ResourceSummary[],
  limit = 10,
): { title: string; path: string; summary: string | null }[] {
  const terms = new Set(tokenize(query));
  if (terms.size === 0) return [];
  return index
    .map((resource) => {
      const titleTerms = tokenize(resource.title);
      const summaryTerms = tokenize(resource.summary ?? "");
      let score = 0;
      for (const term of terms) {
        if (titleTerms.includes(term)) score += 3;
        else if (summaryTerms.includes(term)) score += 1;
      }
      return { resource, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ resource }) => ({
      title: resource.title,
      path: resource.path,
      summary: resource.summary,
    }));
}

/** Chapters of the method guide the agent may consult (public repo). */
const ICM_REFERENCE_FILES = {
  skill: "SKILL.md",
  core: "references/core.md",
  forms: "references/forms.md",
} as const;

const ICM_REFERENCE_FALLBACK =
  "reference unavailable — use the conventions in your instructions";

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

    searchResources: tool({
      description:
        "Search the curated teaching-resources library for materials relevant to a subject or topic. Call this before generating a new step folder, and cite matches by name with [[Title]] wikilinks. If it reports the library is empty or unavailable, proceed without resources.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "The teacher's subject or topic, e.g. 'fractions grade 5 discussion'.",
          ),
      }),
      execute: async ({ query }) => {
        // Degrades in-band — the library is an enhancement, never a blocker.
        try {
          const index = await getResourcesIndex();
          if (index === null) {
            return { available: false as const, reason: "unavailable" as const };
          }
          if (index.length === 0) {
            return { available: false as const, reason: "empty" as const };
          }
          return { available: true as const, results: rankResources(query, index) };
        } catch {
          return { available: false as const, reason: "unavailable" as const };
        }
      },
    }),

    readIcmReference: tool({
      description:
        "Read one chapter of the method guide that defines your workspace conventions. Consult it when structuring a non-trivial step.",
      inputSchema: z.object({
        file: z
          .enum(["skill", "core", "forms"])
          .describe(
            "skill = the method overview; core = the core conventions; forms = folder and file forms.",
          ),
      }),
      execute: async ({ file }) => {
        // Degrades in-band — the conventions in the system prompt are enough
        // when the guide can't be reached.
        try {
          const { owner, repo } = icmReferenceRepoCoords();
          const content = await getPublicFile(
            owner,
            repo,
            ICM_REFERENCE_FILES[file],
          );
          return content ?? ICM_REFERENCE_FALLBACK;
        } catch {
          return ICM_REFERENCE_FALLBACK;
        }
      },
    }),
  };
}

export type WorkspaceTools = ReturnType<typeof createWorkspaceTools>;
