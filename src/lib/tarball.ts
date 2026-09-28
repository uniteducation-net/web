// One-shot markdown bundle download for a public GitHub repo: a single
// codeload tarball (`/tar.gz/<ref>`) carries every file in the repo without
// touching the REST rate limit (codeload is the same infra as `git clone`).
// The response is gunzipped and walked in memory; only `.md` files are kept,
// keyed by repo-relative path (the archive's top-level
// `{owner}-{repo}-{sha}/` segment is stripped). Returns null on any expected
// failure (404, timeout, oversize, corrupt archive) — callers degrade
// in-band, this module never throws for a reachable-but-failing GitHub.
//
// The tar walker is vendored (~80 lines) to avoid a dependency. It handles
// ustar prefixes, GNU longnames ('L'), and pax extended headers ('x' —
// git-archive emits `path=` records for >100-char or non-ASCII paths, which
// international education content will hit). If it ever proves fragile,
// swap the internals for `tar-stream` behind the same export.

// Server-only module — never import from client components.

import { gunzipSync } from "node:zlib";

const FETCH_TIMEOUT_MS = 30_000;
const MAX_ARCHIVE_BYTES = 64 * 1024 * 1024;
const MAX_FILE_BYTES = 16 * 1024 * 1024;
const BLOCK = 512;

function codeloadUrl(owner: string, repo: string, ref: string): string {
  return `https://codeload.github.com/${owner}/${repo}/tar.gz/${ref}`;
}

/** NUL/space-terminated ASCII or utf8 field → trimmed string. */
function readField(buf: Buffer, start: number, end: number): string {
  let stop = start;
  while (stop < end && buf[stop] !== 0) stop++;
  return buf.toString("utf8", start, stop).trim();
}

/** Parse the `len key=value\n` records of a pax extended-header body. */
function readPaxPath(body: Buffer): string | null {
  const text = body.toString("utf8");
  let i = 0;
  while (i < text.length) {
    const space = text.indexOf(" ", i);
    if (space === -1) break;
    const len = Number.parseInt(text.slice(i, space), 10);
    if (!Number.isFinite(len) || len <= 0) break;
    const record = text.slice(space + 1, i + len - 1); // strip trailing \n
    if (record.startsWith("path=")) return record.slice(5);
    i += len;
  }
  return null;
}

/**
 * All `.md` files in a gzipped tar archive, keyed by path relative to the
 * archive's single top-level directory. Returns null on a corrupt archive.
 */
export function extractMarkdownFiles(gz: Buffer): Map<string, string> | null {
  let tar: Buffer;
  try {
    tar = gunzipSync(gz, { maxOutputLength: MAX_ARCHIVE_BYTES * 4 });
  } catch {
    return null;
  }

  const files = new Map<string, string>();
  let offset = 0;
  let paxPath: string | null = null;
  let gnuLongName: string | null = null;

  while (offset + BLOCK <= tar.length) {
    const header = tar.subarray(offset, offset + BLOCK);
    if (header.every((b) => b === 0)) break; // end-of-archive zero block

    const size = Number.parseInt(readField(header, 124, 136), 8);
    if (!Number.isFinite(size) || size < 0 || size > MAX_FILE_BYTES)
      return null; // corrupt or hostile header — bail rather than guess
    const type = String.fromCharCode(header[156]);
    const prefix =
      readField(header, 257, 262) === "ustar"
        ? readField(header, 345, 500)
        : "";
    const name = prefix
      ? `${prefix}/${readField(header, 0, 100)}`
      : readField(header, 0, 100);

    const bodyStart = offset + BLOCK;
    const bodyEnd = bodyStart + size;
    if (bodyEnd > tar.length) return null; // truncated archive

    if (type === "x") {
      paxPath = readPaxPath(tar.subarray(bodyStart, bodyEnd));
    } else if (type === "L") {
      gnuLongName = tar
        .toString("utf8", bodyStart, bodyEnd)
        .replace(/\0[\s\S]*$/, "");
    } else if (type === "0" || type === "\0") {
      const full = paxPath ?? gnuLongName ?? name;
      paxPath = null;
      gnuLongName = null;
      // Strip the single top-level `{owner}-{repo}-{sha}/` directory.
      const rel = full.includes("/") ? full.slice(full.indexOf("/") + 1) : "";
      if (rel.toLowerCase().endsWith(".md")) {
        files.set(rel, tar.toString("utf8", bodyStart, bodyEnd));
      }
    }
    // '5' directories, 'g' global pax headers, and everything else: skip body.

    offset = bodyStart + Math.ceil(size / BLOCK) * BLOCK;
  }

  return files;
}

/**
 * A repo's HEAD default branch, or null. Plain unauthenticated fetch (one
 * request) — used only as the fallback when codeload 404s the literal `HEAD`
 * ref. Kept separate from octokit so this module stays dependency-free.
 */
async function resolveDefaultBranch(
  owner: string,
  repo: string,
): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: "application/vnd.github+json",
        // Same pin as every other GitHub call (lib/github.ts owns the const;
        // inlined here to keep this module dependency-free).
        "X-GitHub-Api-Version": "2026-03-10",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { default_branch?: string };
    return data.default_branch ?? null;
  } catch {
    return null;
  }
}

async function download(
  owner: string,
  repo: string,
  ref: string,
): Promise<Buffer | null> {
  try {
    const res = await fetch(codeloadUrl(owner, repo, ref), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // Next fetch caching stays off: the snapshot module owns freshness.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const length = Number(res.headers.get("content-length") ?? 0);
    if (length > MAX_ARCHIVE_BYTES) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_ARCHIVE_BYTES) return null;
    return buf;
  } catch {
    return null;
  }
}

/**
 * Every markdown file in the repo, keyed by repo-relative path — or null on
 * any failure. One HTTP request in the common case; on a 404 for `HEAD` the
 * default branch is resolved once and retried.
 */
export async function fetchMarkdownBundle(
  owner: string,
  repo: string,
): Promise<Map<string, string> | null> {
  let gz = await download(owner, repo, "HEAD");
  if (gz === null) {
    const branch = await resolveDefaultBranch(owner, repo);
    if (branch === null || branch === "HEAD") return null;
    gz = await download(owner, repo, branch);
    if (gz === null) return null;
  }
  return extractMarkdownFiles(gz);
}
