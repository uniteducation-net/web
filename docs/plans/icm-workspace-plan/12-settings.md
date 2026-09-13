# 12 — Settings modal + account actions

Prerequisites: 09 (bottom-zone buttons exist), 13 (provider logic).

One modal, opened from ⚙ in the sidebar (and the icon rail). Everything
account-ish lives here or in the 👤 menu. Nowhere else.

## Steps

1. **`components/workspace/settings-modal.tsx`** — shadcn `Dialog`, three
   sections, nothing more:

2. **Section 1 — AI provider** (radio group):
   - ○ **Use our free AI** (default) — "Powered by the NGO. Fair-use limits apply."
   - ○ **Connect OpenRouter** — one-click button → OpenRouter OAuth PKCE flow (13 step 4). When connected, show "Connected ✓ / Disconnect".
   - ○ **Use my own API key** — provider select (OpenAI / Anthropic / Google) + password-type input + Save. Store via `/api/settings` (step 4) into the encrypted session cookie. Never log it, never echo it back in plaintext; show only `sk-…abcd` after saving.

3. **Section 2 — Workspace**:
   - Repo name + "Open on GitHub ↗".
   - "Workspace created from the UnitEd template" + link to the ICM repo (credit where due).
   - **"Use a different repository…"** — one workspace at a time, but never a trap:
     - Opens a shadcn `AlertDialog`: "Switch workspace? Nothing is deleted — your current workspace stays on GitHub and you can switch back anytime." Confirm → repo picker.
     - Picker lists repos from `listAccessibleRepos(installationId)` (03 step 3) — only repos the installation covers.
     - Selecting one updates `session.repo` (the primary workspace lookup, 03 step 3) via `/api/settings` (step 4) — switching is just a cookie update: instant, reversible.
     - Repo they want not in the list → it's not granted to the app → show the installation-settings link (`https://github.com/apps/<slug>/installations/<installationId>`) to grant it first, then retry.

4. **Section 3 — Account**:
   - GitHub avatar + login.
   - **Unpair GitHub / Log out** (same action as 09 step 4).
   - Fine-print link: "To fully revoke access: GitHub → Settings → Applications → GitHub Apps → uninstall" → `https://github.com/settings/installations`.

5. **`app/api/settings/route.ts`** (POST): read `{ byokProvider, byokKey }`
   (or `{ clearByok: true }` / `{ openrouterKey }`), merge into the session
   object, re-encrypt the cookie via `setSession` (02). That's the whole
   "settings backend" — a cookie update.

6. **Fair-use note**: when "Use our free AI" is selected, the agent route
   (13) enforces a simple per-day token ceiling. Show current usage vs.
   ceiling as a thin progress line in Section 1. (Implementation: a counter
   cookie updated in the agent route — crude but database-free, and honest
   about it: "resets daily".)

## Done when

- [x] Modal opens from both sidebar modes; three sections render
- [ ] Switching provider persists across reloads (cookie) and changes what `/api/agent` uses
- [ ] Repo-switcher: confirmation dialog blocks accidents, switch updates `session.repo`, tree/preview/agent all follow the new repo
- [ ] Saved keys never appear in any response body, log, or UI beyond last-4
- [ ] OpenRouter connect/disconnect round-trips
- [ ] Logout returns the app to the anonymous onboarding state
- [ ] Free-tier usage line updates after agent calls

> **Status (UI-only pass, 2026-09-13):** Modal UI complete
> (`_components/settings-modal.tsx`) — all three sections render, opens from
> the sidebar bottom row and the collapsed rail icon. All controls are inert:
> no `/api/settings` route, no cookie persistence, no OpenRouter flow, and the
> free-tier usage bar is static (23%).
