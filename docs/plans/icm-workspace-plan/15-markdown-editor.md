# 15 — Markdown editor (Notion-style, Tiptap)

The center column is now an **always-editable** editor, not a read-only
preview: the formatted document IS the editing surface (Notion-style — no
preview/edit tabs). Files stay plain markdown in the user's repo; the editor
parses markdown in and serializes it back out on save.

Strictly official Tiptap v3 APIs (tiptap.dev):

- `@tiptap/markdown` — `contentType: "markdown"` parses initial/set content;
  `editor.getMarkdown()` serializes. (Early release per the docs; table cells
  hold one child node; comments unsupported.)
- `@tiptap/starter-kit` — includes Link + UndoRedo in v3. Do NOT register a
  standalone Link extension alongside it (duplicate-extension warning).
- `@tiptap/extension-table` (`TableKit`) + `@tiptap/extension-list`
  (`TaskList`, `TaskItem`) — REQUIRED, not optional: workspace files contain
  GFM tables and `- [ ]` checklists, and nodes missing from the schema are
  silently dropped on parse → save would destroy content.
- `@tiptap/extensions` (`Placeholder`) — CSS-only hint, rule in globals.css
  (`.tiptap p.is-editor-empty:first-child::before`).
- `@tiptap/react` — `useEditor({ immediatelyRender: false })` (required for
  Next.js SSR), `EditorContent`, `useEditorState` for menu active states;
  `BubbleMenu`/`FloatingMenu` components from `@tiptap/react/menus`.

## Components — `src/components/workspace/editor/`

- `workspace-editor.tsx` — container. Dirty/baseline refs, save/discard/
  conflict orchestration, imperative handle for the shell, Cmd/Ctrl+S.
  Lazy-loads the editor via `next/dynamic` (`ssr: false` — Client Component,
  per the Next lazy-loading guide).
- `tiptap-editor.tsx` — the `useEditor` instance, remounted per file via
  `key={path}`. Hands the Editor instance up through `onEditorInit` (a
  callback — refs don't cross the `dynamic()` boundary reliably).
- `use-editor-file.ts` — fetch + SWR cache (ported from 10), dirty-aware
  refreshKey policy, "Updated just now" toast signal.
- `workspace-file-api.ts` — `WorkspaceFileApi` seam (`read`/`write`,
  `"unauthorized"`/`"sha_mismatch"` results) + the real REST adapter.
- `editor-header.tsx` / `editor-save-button.tsx` / `editor-discard-button.tsx`
  — chrome. Save (primary) and Discard (red + confirm AlertDialog) render
  ONLY while dirty; Refresh disabled while dirty.
- `editor-bubble-menu.tsx` / `editor-floating-menu.tsx` — selection
  formatting menu / empty-line block starters (the Notion feel).
- `editor-conflict-banner.tsx` — sha_mismatch / external-change notice with
  "Reload latest" / "Save anyway".
- `unsaved-changes-dialog.tsx` — file-switch guard (Save/Discard/Cancel).
- `editor-states.tsx` — skeleton, error card, non-md notice.

## Decisions worth knowing

1. **Normalized dirty baseline (C1).** Markdown → doc → markdown is not
   byte-stable, so dirty is `getMarkdown() !== baselineRef.current` where the
   baseline is captured from `getMarkdown()` in `onCreate` (and after every
   save/reload/discard) — never the raw fetched bytes, or files would read
   dirty on open.
2. **Table/TaskList packages (C2)** — see above; dropping them loses data.
3. **Dirty + agent writes.** refreshKey while clean → re-read + `setContent`
   on the mounted editor + toast. While dirty → quiet sha probe; moved →
   conflict banner, never clobber.
4. **File-switch guard.** The shell owns `selectedPath`; a dirty click parks
   the target in `pendingPath` (sidebar highlight stays put) until the dialog
   resolves through the editor's imperative `save()`/`discard()`. The handle
   is rebuilt every render (no deps array) so it never closes over stale
   state; `isDirty()` reads a ref.
5. **Demo reuses everything.** The demo route renders the same container with
   `api={mockFileApi}` (in-memory, `_lib/mock-file-api.ts`) — no duplicated
   editor code; no `repo` prop → GitHub link hidden. The demo is the browser
   test surface (no auth needed).
6. **React Compiler is on** — no manual `useMemo`/`useCallback`; the mutable
   Editor lives in a ref, never in state.
7. **Dirty comparison trims trailing whitespace** (`normalizeMarkdown` in
   `workspace-editor.tsx`). StarterKit's TrailingNode appends an empty
   trailing paragraph after some transactions (undo, setContent) but not at
   initial parse — that paragraph serializes to trailing blank lines, so a
   Ctrl+Z round-trip would otherwise read dirty forever. Trailing blank
   lines are meaningless in markdown, so both sides are `trimEnd()`ed before
   comparing.

## Known limitations

- Workspace repo switch (Settings) while dirty silently loses edits — the
  modal can't know editor state.
- Manual Refresh is disabled while dirty (agent-triggered refreshes degrade
  to the conflict banner instead).
- Per the official markdown docs, a table cell holds only one child node —
  a heading created inside a table cell won't survive the markdown
  round-trip (the serializer can't represent it). Edge case, upstream
  limitation.
- `markdown-preview.tsx` (10) is deleted — reading = the editor surface.
  `react-markdown` stays for the demo agent panel's chat messages.

## Future seam — git-style file status (not built)

`/api/workspace/tree` already returns `{ path, sha }[]`; `file-tree.tsx`
currently drops the sha. Later: keep the shas, diff against a baseline map
(session-start snapshot or a future status route) → `new | modified |
deleted`, thread an optional `status` through `buildTree`'s `TreeNode`, and
render a badge/dot in `TreeRow` (the single render seam; folders can
aggregate child status). The editor's save already refreshes the cached sha.

## Done when

- `pnpm lint` + `pnpm build` pass.
- Browser check on `/workspace/demo`: type `# ` → heading; typing shows Save;
  save persists (reload keeps edits); Discard confirms and reverts; dirty
  file-switch shows the dialog (Cancel/Discard/Save behave); bubble menu
  bolds a selection; floating menu inserts a heading on an empty line; the
  mock table and task lists round-trip through save + reload; png shows the
  non-md notice; no console errors.
