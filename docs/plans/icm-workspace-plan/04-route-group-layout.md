# 04 — `/workspace` route group + state detection

Prerequisites: 02, 03 done.

One page, two states. The server decides which screen to render; the client
never has to guess.

## Steps

1. **`app/workspace/layout.tsx`** (Server Component):
   - Clean, minimal layout that REPLACES the site's marketing nav/footer.
   - Just a full-height flex container (`h-dvh overflow-hidden`). No global header.
   - Load the workspace font/theme here if needed.

2. **`app/workspace/page.tsx`** (Server Component) — the state machine:
   ```
   session = getSession()
   if (!session)                        → render <OnboardingScreen />  (anonymous chat)
   else:
     repo = await findExistingWorkspace(token)
     if (!repo)                         → render <OnboardingScreen authenticated />
     else                               → render <WorkspaceShell repo={repo} />
   ```
   - Both branches may render the same visual chat; the difference is the
     primary action button ("Connect GitHub to save" vs "Create my workspace").
   - Keep this page thin: it only picks the screen. All logic lives in the components.

3. **Handle the mid-onboarding OAuth return**: if the user clicked "Connect
   GitHub" during onboarding, they land back here logged in, with their
   conversation stored client-side (05). The `<OnboardingScreen>` resumes the
   chat and now shows "Create my workspace" instead of "Connect GitHub".

4. **Add a route guard the other way too**: `/workspace` is the ONLY app
   surface. If someone hits `/` (marketing page) while holding a session with
   an existing repo, link them straight to `/workspace`. (Marketing page
   itself is out of scope for these plans.)

5. **Loading states**: add `app/workspace/loading.tsx` with a centered
   `Loader` from AI Elements. The repo lookup (step 2) is a network call —
   the fallback shows while it runs.

## Done when

- [ ] Visiting `/workspace` logged-out shows the onboarding screen
- [ ] Visiting logged-in WITHOUT a repo shows onboarding with the "Create my workspace" action
- [ ] Visiting logged-in WITH an existing `icm-workspace` repo shows the (for now empty) workspace shell
- [ ] No marketing nav/footer visible anywhere under `/workspace`
- [ ] `loading.tsx` spinner appears during repo detection
