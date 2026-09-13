# 04 — `/workspace` route group + state routing

Prerequisites: 02, 03 done.

Two routes, one decision point. `/workspace` is the single canonical entry —
it guards and **redirects**, it never branches. Onboarding lives at its own
route, `/workspace/start`. The client never has to guess.

## Routes

```
/workspace        → entry + guard (server-side redirect)
/workspace/start  → onboarding (anonymous chat AND logged-in-no-repo)
/workspace/demo   → UI preview (dev only; remove before 14)
```

## Steps

1. **`app/workspace/layout.tsx`** (Server Component — already exists):
   - Clean, minimal layout that REPLACES the site's marketing nav/footer.
   - Just a full-height flex container (`h-dvh overflow-hidden`). No global header.
   - Covers both `/workspace` and `/workspace/start`.

2. **`app/workspace/page.tsx`** (Server Component) — the guard:
   ```
   session = getSession()
   if (!session)                        → redirect('/workspace/start')
   repo = await findExistingWorkspace(token)
   if (!repo)                           → redirect('/workspace/start')
   else                                 → render <WorkspaceShell repo={repo} />
   ```
   - Redirects are server-side `redirect()` from `next/navigation` — the repo
     lookup is a cached server call anyway, so no middleware needed.
   - This is what lets returning/pro users go STRAIGHT to `/workspace` without
     ever loading onboarding code (SSR-first).
   - Keep this page thin: it only routes. All logic lives in the components.

3. **`app/workspace/start/page.tsx`** (Server Component) — onboarding:
   - Renders `<OnboardingScreen />` (05) with an `authenticated` flag from
     `getSession()` (controls the save-button label, 05 step 4).
   - Reverse guard: if the session already has a repo → `redirect('/workspace')`.
     Onboarding is unreachable once the workspace exists.

4. **Handle the mid-onboarding OAuth return**: the "Connect GitHub" button
   (05) links to `/api/auth/github?next=/workspace/start`. The user lands back
   on `/workspace/start` logged in, conversation restored from client-side
   storage (05 step 3), and the button now says "Create my workspace" →
   creates the repo (07) → hard-navigates to `/workspace`, where the guard
   now finds the repo and renders the shell.

5. **Auth callbacks stay pointed at `/workspace`** (02): the OAuth `next`
   default and the post-install redirect both target `/workspace` — it is the
   canonical entry and routes onward from there. Only the onboarding screen
   overrides `next` to come back to `/workspace/start`.

6. **Loading states**: `app/workspace/loading.tsx` with a centered
   `Loader` from AI Elements. The repo lookup (step 2) is a network call —
   the fallback shows while it runs.

## Done when

- [ ] Visiting `/workspace` logged-out redirects to `/workspace/start`
- [ ] Visiting `/workspace` logged-in WITHOUT a repo redirects to `/workspace/start`
- [ ] Visiting `/workspace` logged-in WITH an existing repo renders the shell (no onboarding code shipped)
- [ ] Visiting `/workspace/start` WITH an existing repo redirects back to `/workspace`
- [x] No marketing nav/footer visible anywhere under `/workspace`
- [x] `loading.tsx` spinner appears during repo detection

> **Status (UI-only pass, 2026-09-13):** Route group + dual root layout done —
> `/workspace` lives at top level in `src/app/(app)/workspace/` with its own
> root layout (marketing moved to `src/app/(site)/[lang]/`); `proxy.ts`
> excludes `/workspace` from the locale redirect. `/workspace/start` renders
> the onboarding UI with a mock interview (05) — no session/state routing yet,
> so the four redirect boxes above stay unchecked. `loading.tsx` exists
> (Spinner, centered) though nothing suspends yet.
