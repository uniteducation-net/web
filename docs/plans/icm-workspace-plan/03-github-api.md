# 03 — GitHub API helpers (`lib/github.ts`)

Prerequisites: 02 done (we need `githubToken` from the session).

All repo access goes through these functions. Nothing else in the app talks to
api.github.com directly. Every function takes the session's `githubToken` —
we always act **as the user**, on **their** repo.

## Steps

1. **Client factory**: `getOctokit(token)` → `new Octokit({ auth: token })`.

2. **`createWorkspaceFromTemplate(token, repoName)`**:
   - `POST /repos/{template_owner}/{template_repo}/generate` (values from `TEMPLATE_REPO` env) with body `{ owner: <user login>, name: repoName, private: true, description: 'My ICM teaching workspace' }`.
   - Suggested `repoName`: `icm-workspace` (if name taken, GitHub errors — catch 422 and retry with `icm-workspace-2`, etc.).
   - Return `{ owner, name }`.

3. **`findExistingWorkspace(token)`**:
   - `GET /user/repos?per_page=100&sort=created` and look for a repo whose name starts with `icm-workspace` AND whose `description` matches our marker. Return it or `null`.
   - This is how we detect "returning user" without a database: **their GitHub account is the user store.**

4. **`getTree(token, owner, repo)`**:
   - `GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1`
   - Return only `blob` entries, mapped to `{ path, sha }`, sorted by path.

5. **`readFile(token, owner, repo, path)`**:
   - `GET /repos/{owner}/{repo}/contents/{path}` → decode base64 `content` → return `{ content, sha }`.
   - Always keep the `sha` — it's required for updates.

6. **`writeFile(token, owner, repo, path, content, message, sha?)`**:
   - `PUT /repos/{owner}/{repo}/contents/{path}` with `{ message, content: base64, sha }` (sha only when updating an existing file).
   - Every write is a real commit with a human-readable message (e.g. `"Update voice rules via workspace chat"`) — this is the user's version history, treat it with respect.

7. **`commitMany(token, owner, repo, files: {path, content}[], message)`**:
   - For provisioning (07) we write many files at once. Use the Git Data API: create blobs → create tree (base `HEAD`) → create commit → update ref. One commit for the whole personalization instead of N noisy commits.
   - Handle the brand-new-repo edge case: a repo from `/generate` already has an initial commit, so `HEAD` always exists.

8. **Rate-limit guard**: wrap calls in a tiny retry helper (on 403 with `X-RateLimit-Remaining: 0`, surface a friendly error — don't silently hang).

## Done when

- [ ] Each helper is a pure exported async function in `lib/github.ts`
- [ ] `createWorkspaceFromTemplate` produces a **private** repo visible in the test user's GitHub account
- [ ] `getTree` / `readFile` / `writeFile` round-trip works against the test repo (write a file, read it back)
- [ ] `commitMany` creates exactly ONE commit containing all files (check repo commit history)
- [ ] 422 name-collision retry works
