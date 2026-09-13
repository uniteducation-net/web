# 08 — Workspace shell: 3-column layout

Prerequisites: 04 (state machine renders this when a repo exists).

The IDE-style frame. Left sidebar | center preview | right agent panel.
No terminal. Both side panels collapsible.

## Steps

1. **`components/workspace/workspace-shell.tsx`** (`'use client'`):
   - Receives `repo: { owner, name }` from the server page.
   - Layout: CSS grid `grid-cols-[auto_1fr_auto]`, full height.
   - Column 1: `<WorkspaceSidebar />` (09) — width 260px expanded, 0 (or 48px icon rail) collapsed.
   - Column 2: `<MarkdownPreview />` (10) — always visible, takes all remaining space.
   - Column 3: `<AgentPanel />` (11) — width 380px expanded, 0 collapsed.

2. **Collapse mechanics**:
   - Two booleans in state: `sidebarOpen` (default true), `agentOpen` (default true on desktop, false on mobile).
   - Animate with `transition-[width]` — no animation library needed.
   - Keyboard shortcuts: `Cmd/Ctrl+B` toggles sidebar, `Cmd/Ctrl+J` toggles agent panel.
   - When the sidebar is collapsed, show a slim icon rail: ☰ (reopen), logo. Settings/user stay reachable (09, step 5).

3. **Floating reopen buttons**: when a panel is fully hidden, a subtle
   floating button appears at that screen edge (top-left for sidebar,
   top-right for agent). Never trap the user.

4. **Responsive**: below `lg` breakpoint, panels become overlays (slide over
   the center with a backdrop) instead of pushing content — same pattern as
   ChatGPT mobile.

5. **Persist panel state** in `localStorage` (`workspace-panels`) so a
   teacher who works collapsed stays collapsed.

6. **Onboarding continuity**: if `localStorage['onboarding-chat']` exists
   (05), pass those messages into `<AgentPanel>` as its initial history and
   append a system-generated assistant message: *"Your workspace is ready —
   click any file on the left, and ask me anything on the right."* Then clear
   the onboarding key so it happens once.

## Done when

- [x] Three columns render; center never disappears
- [x] Both panels collapse/expand smoothly, shortcuts work, state persists across reload
- [x] Collapsed sidebar still offers settings + user access via the icon rail
- [x] Mobile: panels overlay with backdrop; everything usable at 375px
- [ ] First visit after onboarding: previous conversation appears in the agent panel

> **Status (UI-only pass, 2026-09-13):** All shell mechanics done with mock
> data — `src/app/(app)/workspace/demo/_components/workspace-shell.tsx`. Onboarding
> continuity (step 6) pending 05; the shell currently receives no `repo` prop
> (step 1's server wiring pending 02/03).
