# 09 — Left sidebar: file tree + bottom account zone

Prerequisites: 08 (shell renders `<WorkspaceSidebar />`), 03 (`getTree`).

The sidebar is the ONLY navigation. Top = files from the teacher's repo.
Bottom (pinned) = settings + user. Structure left, action right — never mix.

## Steps

1. **`app/api/workspace/tree/route.ts`** (GET): session → `getTree` →
   return `{ path, sha }[]`. Cache in-memory per session for 30s (the agent
   panel and preview will also want it; don't hammer the API).

2. **`components/workspace/file-tree.tsx`**:
   - Fetch the tree on mount; group paths into a nested folder structure.
   - Render with simple indented rows (chevron for folders, file icon for files). No tree library needed for ICM's shallow depth — keep it ~80 lines.
   - Selected file highlighted; selection lifted to the shell via `onSelect(path)` (the shell passes it down to the preview, 10).
   - Show folders in ICM order (numbered prefixes sort naturally).
   - Empty-state line if the repo is somehow empty: "Your workspace is empty — ask the assistant to scaffold it."

3. **Refresh signal**: export a tiny event (e.g. a `refreshKey` prop bumped by
   the shell) — when the agent (11) writes files, the tree re-fetches.

4. **Bottom zone (pinned, `mt-auto border-t`)** — always visible, two rows:
   - **⚙ Settings** row → opens the settings modal (12).
   - **👤 User row** → avatar + GitHub name; click opens a small dropdown: "View repo on GitHub ↗", "Unpair GitHub / Log out" (calls `/api/auth/logout` then clears `localStorage` and navigates to `/workspace`).

5. **Collapsed mode**: the icon rail (08, step 2) shows ⚙ and 👤 icons that
   open the same modal/dropdown — account actions must never require
   expanding the sidebar.

6. **Loading + error**: skeleton rows while fetching; on 401 (expired
   token), auto-redirect to `/api/auth/github` (re-auth is one click and
   GitHub remembers them).

## Done when

- [x] Tree shows the real files of the teacher's repo, nested and sorted
- [x] Selecting a file updates the center preview
- [x] Tree refreshes after agent edits
- [x] Settings + user rows pinned at bottom in expanded AND icon-rail modes
- [x] Logout fully resets the app to anonymous onboarding
- [x] Expired-token path re-auths without a dead screen

> **Status (implemented, 2026-09-13):** `/api/workspace/tree` returns the real
> repo blob list (30s in-memory cache per workspace); `file-tree.tsx` fetches,
> nests, and renders it with skeleton/empty/401-redirect states. The shell
> owns `treeRefreshKey` and hands `onFilesChanged` to the agent panel — 11
> calls it after repo writes. Logout posts `/api/auth/logout`, clears
> localStorage, and lands on `/workspace/start`.
