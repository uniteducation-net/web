// The Resources middle layer: a small index of the curated markdown resources
// in the public Resources repo (title + one-line summary per file), built
// live from the tree and each file's first ~40 lines, capped at ~25 entries
// and cached for 5 min. `[]` means the repo is genuinely empty (it starts
// that way); `null` means unreachable or rate-limited. Callers must treat
// null as "proceed without resources", never as an error.
// Plan: docs/plans/icm-workspace-plan/00-overview.md (final adjustments, step 2)

// Server-only module — never import from client components.

import {
  getPublicFile,
  getPublicRepoState,
  getPublicTree,
  resourcesRepoCoords,
} from "./public-github";

export interface ResourceSummary {
  path: string;
  title: string;
  summary: string | null;
  /** Frontmatter `type:` — native | link | provider. */
  type: string | null;
  /** Frontmatter `category:` — one of the seven content categories
   *  (1.1 … 3.2) or null when the file declares none. */
  category: string | null;
  /** Frontmatter `url:` — external source for link/provider entries. */
  url: string | null;
}

const MAX_RESOURCES = 25;
const HEAD_LINES = 40;
const POSITIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_TTL_MS = 60_000;

let indexCache: { expiresAt: number; value: ResourceSummary[] | null } | null =
  null;

/** Repo docs that describe the bundle itself, not a usable resource. */
const EXCLUDED_BASENAMES = new Set(["context.md", "readme.md", "claude.md"]);

/**
 * The servable library lives in 20-resources/ (ICM layout): our own markdown
 * (10_native), third-party links (20_links), and big-provider cards
 * (30_providers). Logics (10-logics/) inform matching but are never served
 * as resources; _templates/ are stamps, not content.
 */
const RESOURCE_PREFIXES = [
  "20-resources/10_native/",
  "20-resources/20_links/",
  "20-resources/30_providers/",
];

/**
 * Title + summary from a resource's first lines. Title: the first `# `
 * heading, else the filename. Summary: the first non-heading paragraph after
 * any YAML frontmatter, prefixed with the frontmatter's subject/tags when
 * present. Deliberately naive — resources follow the bundle's frontmatter
 * schema (see the repo's CONTEXT.md), so line-matching is enough.
 */
function summarizeResource(path: string, head: string): ResourceSummary {
  let body = head;
  let frontmatter: string | null = null;
  const fmMatch = head.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fmMatch) {
    frontmatter = fmMatch[1];
    body = head.slice(fmMatch[0].length);
  }

  let title: string | null = null;
  let paragraph: string | null = null;
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      if (!title && trimmed.startsWith("# ")) title = trimmed.slice(2).trim();
      continue;
    }
    paragraph = trimmed;
    break;
  }
  if (!title) {
    const base = path.split("/").pop() ?? path;
    title = base.replace(/\.md$/i, "");
  }

  const bits: string[] = [];
  let type: string | null = null;
  let category: string | null = null;
  let url: string | null = null;
  if (frontmatter) {
    type = frontmatter.match(/^type:\s*(.+)$/m)?.[1]?.trim() ?? null;
    category = frontmatter.match(/^category:\s*(.+)$/m)?.[1]?.trim() ?? null;
    url = frontmatter.match(/^url:\s*(.+)$/m)?.[1]?.trim() ?? null;
    if (category && category !== "none") bits.push(`Category: ${category}`);
  }
  if (paragraph) bits.push(paragraph);

  return {
    path,
    title,
    summary: bits.length > 0 ? bits.join(" — ") : null,
    type,
    category: category === "none" ? null : category,
    url,
  };
}

/**
 * The index of usable resources, or null when the repo can't be read.
 * Never throws for expected unavailability — an empty or unreachable
 * Resources repo is a first-class state, not an exception.
 */
export async function getResourcesIndex(): Promise<ResourceSummary[] | null> {
  if (indexCache && indexCache.expiresAt > Date.now()) return indexCache.value;

  const { owner, repo } = resourcesRepoCoords();
  const tree = await getPublicTree(owner, repo);

  let index: ResourceSummary[] | null;
  if (tree === null) {
    // A null tree is ambiguous (empty repo 409s the same endpoint a rate
    // limit 403s) — probe the repo metadata once to tell them apart.
    const state = await getPublicRepoState(owner, repo);
    index = state === "empty" ? [] : null;
  } else {
    const paths = tree
      .map((entry) => entry.path)
      .filter((path) => {
        const lower = path.toLowerCase();
        const base = lower.split("/").pop() ?? lower;
        return (
          RESOURCE_PREFIXES.some((prefix) => lower.startsWith(prefix)) &&
          lower.endsWith(".md") &&
          !EXCLUDED_BASENAMES.has(base)
        );
      })
      .slice(0, MAX_RESOURCES);

    const summaries = await Promise.all(
      paths.map(async (path) => {
        const content = await getPublicFile(owner, repo, path);
        if (content === null) return null;
        return summarizeResource(
          path,
          content.split("\n").slice(0, HEAD_LINES).join("\n"),
        );
      }),
    );
    index = summaries.filter(
      (summary): summary is ResourceSummary => summary !== null,
    );
  }

  indexCache = {
    expiresAt:
      Date.now() + (index === null ? NEGATIVE_TTL_MS : POSITIVE_TTL_MS),
    value: index,
  };
  return index;
}
