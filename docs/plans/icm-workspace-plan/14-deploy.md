# 14 — Deploy + cost safety

Prerequisites: 01–13 all verified. Last file.

## Steps

1. **Env vars in Vercel** (Project → Settings → Environment Variables):
   the same 6 from 01 step 5, with `APP_URL=https://<prod-domain>` and the
   PROD GitHub OAuth App's client id/secret (01 step 3 — dev and prod are
   separate OAuth Apps).

2. **AI Gateway budget cap** (the NGO safety net):
   - Vercel dashboard → AI Gateway → set a **budget** on the project (e.g. $5/month = the free credit, hard stop).
   - Remember: purchasing credits moves the account off the free tier permanently — stay on the free $5 until real usage data justifies otherwise.
   - Enable spend alerts/notifications if available.

3. **GitHub OAuth App prod check**: callback URL must be exactly
   `https://<domain>/api/auth/github/callback`. Test the full flow on the
   production domain with a throwaway GitHub account BEFORE any teacher sees it.

4. **Cookie security check on prod**: `session` cookie must be `Secure;
   HttpOnly; SameSite=Lax`. Verify in devtools on the real domain (HTTPS only).

5. **End-to-end teacher rehearsal** (fresh GitHub account, fresh browser):
   - [ ] Land → onboarding chat → answer questions → "Connect GitHub"
   - [ ] Authorize → returned to same conversation → "Create my workspace"
   - [ ] Private repo appears in THEIR account, personalized, one personalization commit
   - [ ] Workspace shell loads: tree left, root CONTEXT.md center, agent right
   - [ ] Onboarding conversation visible in agent panel
   - [ ] Ask agent to run a stage → file written, preview refreshes, commit on GitHub
   - [ ] Settings: switch to BYOK with a test key → agent uses it
   - [ ] Logout → back to anonymous onboarding; repo still safe in GitHub
   - [ ] Log back in → workspace detected, no duplicate repo created
   - [ ] Mobile pass at 375px

6. **Cost report ritual**: once a week, check Vercel AI Gateway usage +
   GitHub OAuth app stats. Two numbers, five minutes.

7. **Go/No-Go**: all rehearsal boxes ticked + budget cap confirmed = GO.

## Done when

- [ ] Deployed on production domain, all env vars set
- [ ] Budget cap active — impossible to overspend
- [ ] Full teacher rehearsal passed on a fresh account
- [ ] No database, no auth library, no server state anywhere in the codebase (final grep to confirm)
