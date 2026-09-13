# 10 — Center: formatted markdown preview

Prerequisites: 08 (shell provides selected `path`), 03 (`readFile`).

The calm reading surface. Well-formatted markdown, no raw code, no terminal.

## Steps

1. **`app/api/workspace/file/route.ts`**:
   - GET `?path=…` → `readFile` → return `{ path, content, sha }`.
   - Keep the returned `sha` in client state — the agent panel needs it for safe writes (11).

2. **`components/workspace/markdown-preview.tsx`**:
   - Receives `path` from the shell; fetches content on change (React Query or simple SWR-style cache keyed by path).
   - Render with `react-markdown` + `remark-gfm` inside a `prose` container (`@tailwindcss/typography` — install if missing). Headings, tables, task lists must look clean.
   - Non-markdown files (rare in ICM): show a friendly "Preview unavailable for this file type" with a "View on GitHub ↗" deep link — NOT a raw code dump.

3. **Header bar above the preview** (thin, quiet):
   - File path breadcrumb (`stages / 01-research / CONTEXT.md`)
   - Right side: "Open on GitHub ↗" and a refresh button.

4. **Default selection**: when the shell mounts and nothing is selected,
   auto-select the workspace root `CONTEXT.md` (ICM Layer 1 — "Where do I
   go?"). It's the perfect landing document. Fall back to the first file
   in the tree.

5. **Live updates**: accept the shell's `refreshKey` (same one as 09 step 3) —
   when the agent writes the currently-open file, re-fetch and show the new
   version. Add a subtle "Updated just now" toast so the teacher notices
   the AI changed something.

6. **No editing in v1.** Deliberate: teachers edit by *asking the agent*
   (right panel). If demand appears later, add an edit toggle — the `sha`
   plumbing here already supports it.

## Done when

- [x] Selecting any `.md` file renders it beautifully (GFM tables, lists, headings)
- [x] Root `CONTEXT.md` opens by default
- [ ] Agent edits to the open file appear without manual refresh
- [x] Breadcrumb + GitHub deep link correct for nested paths
- [x] No code editor, no terminal, no raw mode anywhere in the UI

> **Status (UI-only pass, 2026-09-13):** Preview renders mock contents via
> `react-markdown` + `remark-gfm` + `prose`. The GitHub deep link and refresh
> button are inert (`#`), no `/api/workspace/file` route (step 1), no
> refreshKey live updates (step 5) — pending 03/11.
