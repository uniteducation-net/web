# 07 — Repo provisioning: `/api/workspace/create`

Prerequisites: 03 (GitHub helpers), 06 (profile JSON), 05 (button posts here).

The magic moment: profile answers → personalized ICM workspace in the user's
own GitHub account.

## Steps

1. **`app/api/workspace/create/route.ts`** (POST):
   - Require session → 401 if missing.
   - Body: `{ profile: TeacherProfile }` (validate with the zod schema from 06).
   - Call `findExistingWorkspace(session)` first — if one exists, return it immediately (idempotent; double-clicks and refreshes must never create duplicates).
   - Call `createWorkspaceFromTemplate(session, 'united-workspace')` (user token) → then the installation-coverage check (03 step 8) before proceeding.

2. **Fetch template contents**: `getTree` + `readFile` on the NEW repo with the
   **installation token** (it already contains a copy of the template).
   Collect every `.md` file's content.

3. **Personalize in one LLM pass** (`lib/onboarding.ts`):
   - One `generateText` call (Gateway, same cheap model, `maxOutputTokens: 4000`).
   - Input: the profile JSON + the list of `{ path, content }` files.
   - Instruction: replace every `{{PLACEHOLDER}}` with values derived from the profile; adapt `_config/` voice/tone files to the requested tone; fill `setup/questionnaire.md` with the answers as the record of what the teacher said. Do NOT restructure folders, do NOT rename files, do NOT touch stage numbering.
   - Output format: strict JSON array `[{ "path": "…", "content": "…" }]`. Parse with zod; on parse failure, fall back to simple string replacement of `{{PLACEHOLDER}}` tokens (never leave a raw `{{` in a teacher's repo).

4. **Commit**: `commitMany(installationId, owner, repo, personalizedFiles, 'Personalize workspace from onboarding')` — ONE commit (installation token; authored by the app bot).

5. **Respond** `{ owner, repo, url }` and the client navigates to
   `/workspace` (the guard from 04 now finds the repo and shows the shell). Include the
   repo URL so the UI can show "View on GitHub ↗" later.

6. **Failure paths** (all must show a friendly retry, never a stack trace):
   - Name collision → handled inside `createWorkspaceFromTemplate` (03, step 2).
   - LLM parse failure → fallback replacement (step 3).
   - GitHub 5xx → return 502 with `{ error: 'github_unavailable' }`.

## Done when

- [ ] Clicking "Create my workspace" produces a private repo in the test user's account in < 20s
- [ ] Repo contains the template structure with placeholders filled from the profile
- [ ] Commit history: template's initial commit + exactly one "Personalize…" commit
- [ ] Double-clicking the button / re-POSTing returns the existing repo (no duplicates)
- [ ] No `{{` tokens remain in any file
- [ ] `setup/questionnaire.md` contains the teacher's actual answers
