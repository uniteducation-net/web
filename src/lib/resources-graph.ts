// The resources-graph snapshot: the public Resources repo as a graph of
// markdown docs (`[[wikilink]]` edges parsed per the repo's CONTEXT.md
// contract — targets are the target file's `# Title` heading, not its
// filename). Built from ONE git-trees call (getPublicTree, already cached)
// plus ONE codeload tarball (fetchMarkdownBundle, quota-free), gated by a
// sha signature so the tarball is re-downloaded only when the repo actually
// changes. Both /resources/all routes render from this single snapshot —
// the reader never pays a per-file API call.
//
// Same conventions as public-github.ts: module-level cache (5 min positive,
// 60 s negative), never throws for expected unavailability — "empty" (repo
// being seeded) and "unavailable" (rate limit / outage) are first-class
// states the UI renders in-band.

// Server-only module — never import from client components.

import { createHash } from "node:crypto";
import {
  getPublicRepoState,
  getPublicTree,
  resourcesRepoCoords,
} from "./public-github";
import { fetchMarkdownBundle } from "./tarball";

export interface ResourceDocMeta {
  /** Repo path, e.g. "biology/cells.md" — graph node id and tree key. */
  path: string;
  /** Basename without .md, e.g. "cells". */
  name: string;
  /** Full folder path ("" at repo root). */
  folder: string;
  /** First folder segment ("_root" at repo root) — graph color group. */
  topFolder: string;
  /** First `# ` heading, else `name`. */
  title: string;
  /** Frontmatter `type:` (template/guide/rubric/routine), else null. */
  type: string | null;
  /** First body paragraph, inline markdown stripped, ≤240 chars. */
  excerpt: string;
  /** Reader URL: /resources/all/<path> with .md stripped, segments encoded. */
  href: string;
}

export interface ResourceLink {
  source: string;
  target: string;
}

export interface ResourcesGraphData {
  generatedAt: string;
  docs: ResourceDocMeta[];
  links: ResourceLink[];
  /** Dropped `[[targets]]` with no matching doc — observability while the
   *  repo is being seeded. */
  unresolvedLinks: number;
}

export type ResourcesSnapshotState =
  | { status: "ready"; data: ResourcesGraphData }
  | { status: "empty" }
  | { status: "unavailable" };

export type ResourceDocumentResult =
  | { status: "ready"; meta: ResourceDocMeta; content: string }
  | { status: "missing" }
  | { status: "unavailable" };

const POSITIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_TTL_MS = 60_000;

interface Snapshot {
  signature: string;
  state: ResourcesSnapshotState & { status: "ready" };
  /** Raw file bodies by path — never leaves this module. */
  contents: Map<string, string>;
  /** Normalized `# Title` / basename → path, for wikilink resolution. */
  titleIndex: Map<string, string>;
}

let snapshotCache: { expiresAt: number; snapshot: Snapshot } | null = null;
let negativeCache: {
  expiresAt: number;
  state: { status: "empty" } | { status: "unavailable" };
} | null = null;

// ─── Parsing ─────────────────────────────────────────────────────────────

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
/** `[[Target]]` / `[[Target|alias]]` — the repo's CONTEXT.md wikilink syntax. */
const WIKILINK_RE = /\[\[([^\][|]+)(?:\|([^\][]+))?\]\]/g;

/** Title/basename → comparable slug: "Lesson Plan Template" → "lesson-plan-template". */
function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.md$/i, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

/** First `# ` heading of the body, else null. */
function scanTitle(body: string): string | null {
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("# ")) return trimmed.slice(2).trim();
    if (!trimmed.startsWith("#")) return null; // body started — give up
  }
  return null;
}

/** First non-heading body paragraph, inline markdown stripped, ≤240 chars. */
function scanExcerpt(body: string): string {
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const text = trimmed
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`~]/g, "")
      .replace(/\[\[([^\][|]+)\|([^\][]+)\]\]/g, "$2")
      .replace(/\[\[([^\][]+)\]\]/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 240 ? `${text.slice(0, 237)}…` : text;
  }
  return "";
}

function readerHref(path: string): string {
  const noExt = path.replace(/\.md$/i, "");
  return `/resources/all/${noExt.split("/").map(encodeURIComponent).join("/")}`;
}

function parseDoc(path: string, raw: string): ResourceDocMeta {
  const fmMatch = raw.match(FRONTMATTER_RE);
  const frontmatter = fmMatch?.[1] ?? null;
  const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;

  const name = (path.split("/").pop() ?? path).replace(/\.md$/i, "");
  const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  return {
    path,
    name,
    folder,
    topFolder: folder.split("/")[0] || "_root",
    title: scanTitle(body) ?? name,
    type: frontmatter?.match(/^type:\s*(.+)$/m)?.[1]?.trim() ?? null,
    excerpt: scanExcerpt(body),
    href: readerHref(path),
  };
}

// ─── Snapshot build ──────────────────────────────────────────────────────

function buildSnapshot(
  signature: string,
  mdPaths: string[],
  bundle: Map<string, string>,
): Snapshot {
  const contents = new Map<string, string>();
  const docs: ResourceDocMeta[] = [];
  for (const path of mdPaths) {
    const raw = bundle.get(path);
    if (raw === undefined) continue; // tree/archive skew — skip, don't fail
    contents.set(path, raw);
    docs.push(parseDoc(path, raw));
  }

  // Title index first (the contract's canonical form), basename as fallback —
  // both slug-normalized so "Lesson Plan Template" and "lesson-plan-template"
  // hit the same entry. Sorted insertion keeps collisions deterministic.
  const titleIndex = new Map<string, string>();
  for (const doc of docs) {
    if (!titleIndex.has(normalizeKey(doc.title)))
      titleIndex.set(normalizeKey(doc.title), doc.path);
    if (!titleIndex.has(normalizeKey(doc.name)))
      titleIndex.set(normalizeKey(doc.name), doc.path);
  }

  const links: ResourceLink[] = [];
  const seen = new Set<string>();
  let unresolvedLinks = 0;
  for (const doc of docs) {
    const raw = contents.get(doc.path) ?? "";
    for (const match of raw.matchAll(WIKILINK_RE)) {
      const target = resolveWikilink(match[1], mdPaths, titleIndex);
      if (target === null) {
        unresolvedLinks++;
        continue;
      }
      if (target === doc.path) continue; // self-link
      const key = `${doc.path}|${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ source: doc.path, target });
    }
  }

  return {
    signature,
    state: {
      status: "ready",
      data: {
        generatedAt: new Date().toISOString(),
        docs,
        links,
        unresolvedLinks,
      },
    },
    contents,
    titleIndex,
  };
}

/** `[[target]]` → repo path. `/`-containing targets are path-like (exact,
 *  then suffix); bare targets go through the title/basename index. */
function resolveWikilink(
  rawTarget: string,
  mdPaths: string[],
  titleIndex: Map<string, string>,
): string | null {
  const target = rawTarget.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!target) return null;
  if (target.includes("/")) {
    const withExt = target.toLowerCase().endsWith(".md")
      ? target
      : `${target}.md`;
    const exact = mdPaths.find(
      (p) => p.toLowerCase() === withExt.toLowerCase(),
    );
    if (exact) return exact;
    const suffix = mdPaths.find((p) =>
      p.toLowerCase().endsWith(`/${withExt.toLowerCase()}`),
    );
    if (suffix) return suffix;
    return null;
  }
  return titleIndex.get(normalizeKey(target)) ?? null;
}

// ─── Public API ──────────────────────────────────────────────────────────

/** sha1 of every md `path:sha` pair — changes exactly when content changes. */
function contentSignature(entries: { path: string; sha: string }[]): string {
  return createHash("sha1")
    .update(entries.map((e) => `${e.path}:${e.sha}`).join("\n"))
    .digest("hex");
}

function setNegative(state: { status: "empty" } | { status: "unavailable" }) {
  negativeCache = { expiresAt: Date.now() + NEGATIVE_TTL_MS, state };
  return state;
}

async function ensureSnapshot(): Promise<
  | { status: "ready"; snapshot: Snapshot }
  | { status: "empty" }
  | { status: "unavailable" }
> {
  if (snapshotCache && snapshotCache.expiresAt > Date.now()) {
    return { status: "ready", snapshot: snapshotCache.snapshot };
  }
  if (negativeCache && negativeCache.expiresAt > Date.now()) {
    return negativeCache.state;
  }

  const { owner, repo } = resourcesRepoCoords();
  const tree = await getPublicTree(owner, repo);
  if (tree === null) {
    // Null tree is ambiguous (empty repo 409s the same endpoint a rate
    // limit 403s) — probe once to tell them apart.
    const repoState = await getPublicRepoState(owner, repo);
    return setNegative(
      repoState === "empty" ? { status: "empty" } : { status: "unavailable" },
    );
  }

  const mdEntries = tree.filter((e) => e.path.toLowerCase().endsWith(".md"));
  if (mdEntries.length === 0) return setNegative({ status: "empty" });

  // The sha signature is the change check: an unchanged repo reuses the
  // cached snapshot and skips the tarball download entirely.
  const signature = contentSignature(mdEntries);
  if (snapshotCache && snapshotCache.snapshot.signature === signature) {
    snapshotCache.expiresAt = Date.now() + POSITIVE_TTL_MS;
    return { status: "ready", snapshot: snapshotCache.snapshot };
  }

  const bundle = await fetchMarkdownBundle(owner, repo);
  if (bundle === null) return setNegative({ status: "unavailable" });

  const snapshot = buildSnapshot(
    signature,
    mdEntries.map((e) => e.path),
    bundle,
  );
  snapshotCache = { expiresAt: Date.now() + POSITIVE_TTL_MS, snapshot };
  console.info(
    `[resources-graph] snapshot rebuilt: ${snapshot.state.data.docs.length} docs, ` +
      `${snapshot.state.data.links.length} links, ` +
      `${snapshot.state.data.unresolvedLinks} unresolved`,
  );
  return { status: "ready", snapshot };
}

/**
 * The explorer payload for /resources/all. "empty" = repo is being seeded;
 * "unavailable" = GitHub unreachable/rate-limited — render both in-band.
 */
export async function getResourcesSnapshot(): Promise<ResourcesSnapshotState> {
  const result = await ensureSnapshot();
  return result.status === "ready"
    ? { status: "ready", data: result.snapshot.state.data }
    : result;
}

/**
 * One document for the /resources/all/[...path] reader, from the shared
 * snapshot. "missing" (→ 404) is distinguished from "unavailable" (→ notice)
 * so a GitHub hiccup never becomes a cached 404.
 */
export async function getResourceDocument(
  path: string,
): Promise<ResourceDocumentResult> {
  const result = await ensureSnapshot();
  if (result.status !== "ready") {
    return result.status === "empty"
      ? { status: "missing" }
      : { status: "unavailable" };
  }
  const content = result.snapshot.contents.get(path);
  if (content === undefined) return { status: "missing" };
  const meta = result.snapshot.state.data.docs.find((d) => d.path === path);
  if (!meta) return { status: "missing" };
  // Reader-oriented body: frontmatter is metadata, and the leading `# Title`
  // already renders as the page's styled h1 (meta.title) — strip both.
  const body = content
    .replace(FRONTMATTER_RE, "")
    .replace(/^(\s*)# [^\n]*(\n|$)/, "$1");
  return { status: "ready", meta, content: body };
}

/**
 * Rewrite `[[Title]]` / `[[Title|alias]]` in a document body as reader-page
 * markdown links, using the snapshot's resolver. Unresolved targets degrade
 * to plain text (the repo is still being linked up). Returns the input
 * unchanged when the snapshot is unavailable.
 */
export async function linkifyResourceWikilinks(content: string): Promise<string> {
  const result = await ensureSnapshot();
  if (result.status !== "ready") return content;
  const { titleIndex } = result.snapshot;
  const mdPaths = result.snapshot.state.data.docs.map((d) => d.path);
  return content.replace(WIKILINK_RE, (_m, target: string, alias?: string) => {
    const path = resolveWikilink(target, mdPaths, titleIndex);
    const label = (alias ?? target).trim();
    return path === null ? label : `[${label}](${readerHref(path)})`;
  });
}
