# 14 — Deploy + cost safety

Prerequisites: 01–13 all verified. Last file.

## Steps

1. **Env vars in Vercel** (Project → Settings → Environment Variables):
   the same required vars from 01 step 5, with `APP_URL=https://<prod-domain>`
   and the PROD GitHub App's credentials (01 step 3 — dev and prod are separate
   GitHub Apps; don't forget the prod app's private key). The three
   repo-provisioning vars are optional (defaults built in); set
   `RESOURCES_INSTALLATION_ID` only if the 60 req/h anonymous public-read
   budget ever becomes a problem (99 issue 10).

2. **AI Gateway budget cap** (the NGO safety net):
   - Vercel dashboard → AI Gateway → set a **budget** on the project (e.g. $5/month = the free credit, hard stop).
   - Remember: purchasing credits moves the account off the free tier permanently — stay on the free $5 until real usage data justifies otherwise.
   - Enable spend alerts/notifications if available.

3. **GitHub App prod check**: callback URL must be exactly
   `https://<domain>/api/auth/github/callback` and Setup URL exactly
   `https://<domain>/api/auth/github/installed`. Test the full authorize →
   install flow on the production domain with a throwaway GitHub account
   BEFORE any teacher sees it.

4. **Cookie security check on prod**: `session` cookie must be `Secure;
   HttpOnly; SameSite=Lax`. Verify in devtools on the real domain (HTTPS only).

5. **End-to-end teacher rehearsal** (brand-new GitHub account CREATED THROUGH THE FLOW — that's the primary user scenario; fresh browser):
   - [ ] Land → onboarding chat → answer questions → "Save my workspace"
   - [ ] "Create an account" on the authorize screen → signup → email verify → authorize → install app (All repositories, one click) → returned to same conversation → "Create my workspace"
   - [ ] Private repo named `UnitEd-Workspace` appears in THEIR account, seeded with `00-Profile/` + `01-Start Here/`, one seed commit per stage
   - [ ] Workspace shell loads: tree left, `01-Start Here/Start Here.md` center, agent right
   - [ ] Onboarding conversation visible in agent panel
   - [ ] Ask agent to run a stage → file written, preview refreshes, commit on GitHub (authored by the app bot)
   - [ ] Settings: switch to BYOK with a test key → agent uses it
   - [ ] Settings: switch workspace to a second repo → confirm dialog → tree/preview/agent follow → switch back
   - [ ] Logout → back to anonymous onboarding; repo still safe in GitHub
   - [ ] Log back in → workspace detected, no duplicate repo created
   - [ ] Mobile pass at 375px

6. **Cost report ritual**: once a week, check Vercel AI Gateway usage +
   GitHub App stats (installations count). Two numbers, five minutes.

7. **Go/No-Go**: all rehearsal boxes ticked + budget cap confirmed = GO.

## Done when

- [ ] Deployed on production domain, all env vars set
- [ ] Budget cap active — impossible to overspend
- [ ] Full teacher rehearsal passed on a fresh account
- [ ] No database, no auth library, no server state anywhere in the codebase (final grep to confirm)
