# 03 — GitHub API helpers (`lib/github.ts`)

Prerequisites: 02 done (we need the session's user token + `installationId`).

All authenticated repo access goes through these functions. Nothing else in
the app talks to api.github.com with a token — the only other GitHub traffic
is the UNAUTHENTICATED public-read helpers (`lib/public-github.ts` +
`lib/resources.ts`, step 10 below). Two token types, two clients (see 02 for why):

- **User token** (`ghu_…`, 8h + refresh) → repo creation + installation
  lookup. Creating a repo in a personal account requires user auth.
- **Installation token** (minted on demand, 1h) → all steady-state repo ops
  (tree, read, write, commit). Scoped to exactly what the teacher installed —
  this is the trust win over OAuth's broad `repo` scope.

## Steps

1. **Client factories**:
   - `getUserOctokit(session)` → `new Octokit({ auth: await getValidUserToken() })` — refreshes the 8h token via the session helper (02 step 1) when needed.
   - `getInstallationOctokit(installationId)` → `new App({ appId: GITHUB_APP_ID, privateKey: base64Decode(GITHUB_APP_PRIVATE_KEY) }).getInstallationOctokit(installationId)` — `App` comes from the `octokit` package; it caches and auto-renews the 1h token internally.

2. **`createWorkspaceRepo(session, repoName)`** — USER token (replaced `createWorkspaceFromTemplate` in the 2026-09-14 rebuild; no template repo anywhere):
   - `repos.createForAuthenticatedUser({ name: repoName, private: true, description: 'My UnitEd Workspace', auto_init: true })` — no `owner`, it defaults to the authenticated user. `auto_init` lands the initial commit (a default README) that `commitMany`'s HEAD requirement needs; provisioning (07) overwrites the README in its second commit.
   - Suggested `repoName`: `UnitEd-Workspace` — the `WORKSPACE_REPO_NAME` export; case matters, `findExistingWorkspace`'s prefix scan is case-sensitive. On a 422 name collision, retry as `UnitEd-Workspace-2`, `-3`, … up to `-5`. Teacher-facing name is always **"UnitEd Workspace"** — "ICM" stays in our internals (commit messages, docs), never in what we create for them.
   - Return `{ owner, name }` and persist it into the session (`repo` field) — it becomes the primary workspace lookup (99 issue 4). Re-read the session before writing: `getValidUserToken()` may just have rotated the tokens, and writing the caller's stale copy would resurrect the dead refresh token.

3. **`findExistingWorkspace(session)`**:
   - Primary: `session.repo` — verify it still exists with one cheap `GET /repos/{owner}/{repo}` (installation token).
   - Fallback (no `repo` in session, or the primary 404/403s): `GET /installation/repositories` (installation token) and look for a repo whose name starts with `UnitEd-Workspace` OR the legacy pre-rename `united-workspace` prefix AND whose `description` matches our marker (`WORKSPACE_DESCRIPTION`). Return it or `null`.
   - This is how we detect "returning user" without a database: **their GitHub account is the user store.**
   - Also export **`listAccessibleRepos(installationId)`** — same endpoint (`GET /installation/repositories`, installation token), returns `{ owner, name, description }[]` for every repo the installation covers. Used by the Settings repo-switcher (12) — one workspace at a time, but the teacher can point it at another of their repos.

4. **`getTree(installationId, owner, repo)`** — installation token:
   - `GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1`
   - Return only `blob` entries, mapped to `{ path, sha }`, sorted by path.

5. **`readFile(installationId, owner, repo, path)`** — installation token:
   - `GET /repos/{owner}/{repo}/contents/{path}` → decode base64 `content` → return `{ content, sha }`.
   - Always keep the `sha` — it's required for updates.

6. **`writeFile(installationId, owner, repo, path, content, message, sha?)`** — installation token:
   - `PUT /repos/{owner}/{repo}/contents/{path}` with `{ message, content: base64, sha }` (sha only when updating an existing file).
   - Every write is a real commit with a human-readable message (e.g. `"Update voice rules via workspace chat"`) — this is the user's version history, treat it with respect.
   - Commits will be authored by the app bot (`<app-slug>[bot]`) — that's correct and transparent.

7. **`commitMany(installationId, owner, repo, files: {path, content}[], message)`** — installation token:
   - For provisioning (07) we write many files at once. Use the Git Data API: create blobs → create tree (base `HEAD`) → create commit → update ref. One commit per seed stage instead of N noisy commits.
   - REQUIRES an existing HEAD: repos from `createWorkspaceRepo` always have one via `auto_init`. The create route handles the foreign-empty-repo edge (a repo created outside our flow can have no HEAD — git-trees 409s) by writing the first file with `writeFile`, which works with no HEAD and creates the initial commit.

8. **Installation coverage check** (`checkInstallationCoverage`): right after `createWorkspaceRepo`, call `getTree` with the INSTALLATION token. If it 404/403s, the teacher installed the app on "Only select repositories" and the new repo isn't covered → respond with a deep link to `https://github.com/apps/<slug>/installations/<installationId>` so they can grant access in one click, then retry. (Install copy in 02 tells them to keep "All repositories" selected; this is the safety net.)

9. **Rate-limit guard**: `withGitHubGuard` wraps every call (on 403 with `X-RateLimit-Remaining: 0`, throw `GitHubRateLimitError` — don't silently hang). Exported for reuse by the public-read helpers (step 10), which turn it into a cached null.

10. **Public-read helpers** (`lib/public-github.ts` + `lib/resources.ts`, added 2026-09-14):
   - The two PUBLIC repos the workspace depends on — the curated Resources bundle (`RESOURCES_REPO`, default `uniteducation-net/Resources`) and the live method reference (`ICM_REFERENCE_REPO`, default `RinDig/icm-architect`) — are read UNAUTHENTICATED by default (`new Octokit()`, 60 req/h per IP); setting `RESOURCES_INSTALLATION_ID` routes reads through the org's app installation instead (5,000 req/h).
   - `getPublicTree` / `getPublicFile` / `getPublicRepoState` / `getIcmReference` — module-level Map caches (trees/files 5 min, ICM reference 1 h, negative results 60 s); every expected miss (404, empty-repo 409, rate limit) returns a cached null, never throws. Callers degrade in-band.
   - `getResourcesIndex()` (resources.ts) — title + one-line summary per `resources/*.md`, capped at 25; `[]` = genuinely empty repo, `null` = unreachable. Used by provisioning (07) and the agent's `searchResources` tool (11).

## Done when

- [ ] Each helper is a pure exported async function in `lib/github.ts`
- [ ] `createWorkspaceRepo` (user token) produces a **private** repo named `UnitEd-Workspace` visible in the test user's GitHub account
- [ ] `getTree` on the fresh repo works with the INSTALLATION token immediately after creation (install = "All repositories")
- [ ] `getTree` / `readFile` / `writeFile` round-trip works against the test repo (write a file, read it back)
- [ ] `commitMany` creates exactly ONE commit containing all files, authored by the app bot (check repo commit history)
- [ ] 422 name-collision retry works
- [ ] Selected-repos install → coverage check catches it and returns the fix link
- [x] Public reads (`getPublicTree`/`getPublicFile`/`getIcmReference`/`getResourcesIndex`) work unauthenticated against both public repos, degrade to cached null on empty/rate-limit (code-verified with live reads, 2026-09-14)
