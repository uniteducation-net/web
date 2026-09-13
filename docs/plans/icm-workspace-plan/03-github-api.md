# 03 — GitHub API helpers (`lib/github.ts`)

Prerequisites: 02 done (we need the session's user token + `installationId`).

All repo access goes through these functions. Nothing else in the app talks to
api.github.com directly. Two token types, two clients (see 02 for why):

- **User token** (`ghu_…`, 8h + refresh) → repo creation + installation
  lookup. Creating a repo in a personal account requires user auth.
- **Installation token** (minted on demand, 1h) → all steady-state repo ops
  (tree, read, write, commit). Scoped to exactly what the teacher installed —
  this is the trust win over OAuth's broad `repo` scope.

## Steps

1. **Client factories**:
   - `getUserOctokit(session)` → `new Octokit({ auth: await getValidUserToken() })` — refreshes the 8h token via the session helper (02 step 1) when needed.
   - `getInstallationOctokit(installationId)` → `new App({ appId: GITHUB_APP_ID, privateKey: base64Decode(GITHUB_APP_PRIVATE_KEY) }).getInstallationOctokit(installationId)` — `App` comes from the `octokit` package; it caches and auto-renews the 1h token internally.

2. **`createWorkspaceFromTemplate(session, repoName)`** — USER token:
   - `POST /repos/{template_owner}/{template_repo}/generate` (values from `TEMPLATE_REPO` env) with body `{ name: repoName, private: true, description: 'My UnitEd Workspace' }` — omit `owner`, it defaults to the authenticated user. Works with GitHub App user access tokens because the app has `Administration: write` + `Contents: read`.
   - Suggested `repoName`: `united-workspace` (if name taken, GitHub errors — catch 422 and retry with `united-workspace-2`, etc.). Teacher-facing name is always **"UnitEd Workspace"** — "ICM" stays in our internals (template repo, commit messages, docs), never in what we create for them.
   - Return `{ owner, name }` and persist it into the session (`repo` field) — it becomes the primary workspace lookup (99 issue 4).

3. **`findExistingWorkspace(session)`**:
   - Primary: `session.repo` — verify it still exists with one cheap `GET /repos/{owner}/{repo}` (installation token).
   - Fallback (no `repo` in session): `GET /installation/repositories` (installation token) and look for a repo whose name starts with `united-workspace` AND whose `description` matches our marker. Return it or `null`.
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
   - For provisioning (07) we write many files at once. Use the Git Data API: create blobs → create tree (base `HEAD`) → create commit → update ref. One commit for the whole personalization instead of N noisy commits.
   - Handle the brand-new-repo edge case: a repo from `/generate` already has an initial commit, so `HEAD` always exists.

8. **Installation coverage check**: right after `createWorkspaceFromTemplate`, call `getTree` with the INSTALLATION token. If it 404/403s, the teacher installed the app on "Only select repositories" and the new repo isn't covered → respond with a deep link to `https://github.com/apps/<slug>/installations/<installationId>` so they can grant access in one click, then retry. (Install copy in 02 tells them to keep "All repositories" selected; this is the safety net.)

9. **Rate-limit guard**: wrap calls in a tiny retry helper (on 403 with `X-RateLimit-Remaining: 0`, surface a friendly error — don't silently hang).

## Done when

- [ ] Each helper is a pure exported async function in `lib/github.ts`
- [ ] `createWorkspaceFromTemplate` (user token) produces a **private** repo visible in the test user's GitHub account
- [ ] `getTree` on the fresh repo works with the INSTALLATION token immediately after creation (install = "All repositories")
- [ ] `getTree` / `readFile` / `writeFile` round-trip works against the test repo (write a file, read it back)
- [ ] `commitMany` creates exactly ONE commit containing all files, authored by the app bot (check repo commit history)
- [ ] 422 name-collision retry works
- [ ] Selected-repos install → coverage check catches it and returns the fix link
