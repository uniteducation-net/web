# 07 — Repo provisioning: `/api/workspace/create`

Prerequisites: 03 (GitHub helpers), 06 (profile JSON), 05 (button posts here).

The magic moment: profile answers → a private `UnitEd-Workspace` repo in the
teacher's own GitHub account, seeded with just `00-Profile/` and
`01-Start Here/`. Later content is NOT seeded — the workspace agent (11)
grows the repo one numbered micro-step folder at a time
(`02-Step 1 - <Title>/`, …).

> **Rebuilt (2026-09-14, "final adjustments"):** the original design copied an
> NGO-owned template repo via the `/generate` API and personalized
> `{{PLACEHOLDER}}` tokens in one LLM pass. All of that is gone — there is no
> template repo, no placeholder sweep, and no one-shot personalization (this
> also resolves 99-known-issues #5 by deletion). The repo is created nearly
> empty (`auto_init`), the profile lands deterministically, and Start Here is
> one optional LLM pass with a complete deterministic fallback.

## Steps

1. **`app/api/workspace/create/route.ts`** (POST, `export const maxDuration = 300`):
   - Require session → 401 if missing.
   - Body: `{ profile: TeacherProfile }` (validate with the zod schema from 06) → 400 `invalid_profile`.
   - Call `findExistingWorkspace(session)` first — idempotency: double-clicks, refreshes, and retries after a coverage fix never create duplicates. An existing repo may still be unseeded (a previous attempt died after creation) — the seed stages below finish it.
   - Otherwise `createWorkspaceRepo(session, WORKSPACE_REPO_NAME)` (03 step 2 — user token, `auto_init`, 422 retry loop `UnitEd-Workspace-2`…`-5`).
   - `session.installationId` missing → 409 `app_not_installed`.
   - Installation-coverage check (03 step 8) before any repo op → 409 `installation_not_covering_repo` + one-click `fixUrl`.

2. **Detect seed state** (`lib/provisioning.ts#detectSeedState`):
   - `getTree` (installation token) → `hasProfile` (keys on `00-Profile/profile.md`) / `hasStartHere` (anything under `01-Start Here/`). Both present → respond immediately; a re-POST costs one tree read and zero commits.
   - Edge: a completely empty repo (created outside our flow, no HEAD) 409s the git-trees API — treat as fully unseeded and set `needsInitialCommit`; the first profile file is then written with `writeFile` (works with no HEAD and creates the initial commit `commitMany` requires), the rest with `commitMany`.

3. **`00-Profile/` — deterministic, no LLM** (`buildProfileFiles`):
   - `00-Profile/CONTEXT.md` (folder contract: who reads it, who writes it) + `00-Profile/profile.md` (the six onboarding answers; nulls → "Not shared during onboarding").
   - ONE commit, "Add teacher profile from onboarding" — committed FIRST, before any network/LLM work, so a later failure still leaves resumable state.

4. **`01-Start Here/` — one optional LLM pass that always lands**:
   - `getResourcesIndex()` (`lib/resources.ts`) + `getIcmReference()` (`lib/public-github.ts`) — neither ever throws: `[]` = genuinely empty Resources repo, `null` = unreachable/rate-limited.
   - Fair-use gate: the LLM pass spends the NGO's free tier, so skip it when `AI_GATEWAY_API_KEY` is unset or the teacher is over today's ceiling. Provisioning is NEVER blocked — it degrades to the deterministic fallback.
   - `generateStartHere(profile, resourceIndex, icmExcerpt)`: one `generateText` (Gateway `google/gemini-2.5-flash`, `maxOutputTokens: 2000`). Resource matching is folded into the prompt (model picks the ≤5 most relevant, cited as `[[Title]]` wikilinks). Output is zod-validated against EXACTLY the two expected paths (`01-Start Here/Start Here.md` + `01-Start Here/CONTEXT.md`).
   - **Every** failure mode — missing key, thrown call, unparseable output, wrong path set — returns `buildStartHereFallback(profile, resourceIndex)` with `usageTokens: 0`: warm welcome, how-the-workspace/chat works, progressive-path explainer, matched-resources bullets (or a "resources on the way" note when the index is empty/null), plus the folder's `CONTEXT.md`.
   - `addFairUseTokens(usage)` only on real LLM spend (legal here — a plain JSON route can still set cookies).
   - ONE commit, "Add your getting-started guide": the two Start Here files + our short teacher-facing `README.md` replacing the `auto_init` default.

5. **Respond** `{ owner, repo, url }` and the client navigates to
   `/workspace` (the guard from 04 now finds the repo and shows the shell).

6. **Failure paths** (all must show a friendly retry, never a stack trace):
   - Name collision → handled inside `createWorkspaceRepo` (03, step 2).
   - Resources / ICM-reference reads NEVER fail the route — in-band degradation (cached null → fallback content / agent proceeds without resources).
   - `GitHubRateLimitError` → 503 `{ error: 'github_rate_limited' }`; GitHub 5xx → 502 `{ error: 'github_unavailable' }`; anything else → 500 `{ error: 'workspace_create_failed' }`.

## Done when

- [x] Idempotent by construction: `findExistingWorkspace` first, then `detectSeedState` short-circuits a fully seeded repo (code-verified in `route.ts` + `provisioning.ts`)
- [x] `00-Profile/` is deterministic — no LLM, no `{{` tokens anywhere in the pipeline (code-verified: pure builders)
- [x] Start Here falls back deterministically on EVERY failure mode — no Gateway key, LLM throw, unparseable JSON, wrong path set, empty/unreachable Resources (code-verified in `generateStartHere`)
- [x] Fair-use gate skips the LLM pass when over the daily ceiling or no key is set; usage metered only on real spend (code-verified)
- [x] Profile commit lands before any network/LLM work; empty-repo (no HEAD) edge handled via `writeFile` (code-verified)
- [x] Start Here + README overwrite land as ONE commit (code-verified)
- [x] `maxDuration = 300` on the route (code-verified; 99 #8)
- [ ] Fresh account end-to-end: clicking "Create my workspace" produces a private `UnitEd-Workspace` with `00-Profile/` + `01-Start Here/` in the test user's account — blocked on live GitHub App env
- [ ] Double-clicking / re-POSTing returns the existing repo with zero new commits — blocked on live GitHub App env
- [ ] Delete `01-Start Here/` on GitHub → re-POST regenerates only that stage — blocked on live GitHub App env
- [ ] `AI_GATEWAY_API_KEY` unset → deterministic Start Here, fair-use counter untouched — blocked on live GitHub App env
