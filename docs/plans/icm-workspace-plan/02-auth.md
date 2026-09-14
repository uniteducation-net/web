# 02 — Auth: GitHub App (user OAuth + installation) with encrypted cookie session

Prerequisites: 01 done. **No auth library. No database.** ~4 small files.

We use a **GitHub App**, not an OAuth App (fine-grained permissions, consent
screen teachers can trust — see 99 issue 1). The flow has two GitHub-side
steps, chained by us:

1. **Authorize** (OAuth web flow with the app's client id) → identifies the
   user, yields a **user access token** (`ghu_…`, expires 8h) + **refresh
   token** (`ghr_…`, expires 6 months). No `scope` param — GitHub Apps use
   fine-grained permissions configured on the app itself.
2. **Install** the app on the user's personal account → yields an
   `installation_id`, from which we mint **installation access tokens**
   server-side on demand (1h TTL, no refresh dance in the cookie).

Token split (important):
- **User token** → repo *creation* (`createForAuthenticatedUser`, 03 step 2) + listing installations.
  Creating a repo in a personal account requires user authentication — an
  installation token can't do it (serverToServer is orgs-only).
- **Installation token** → everything else (tree, read, write, commit).
  Minted on demand from the app private key, so the steady-state workspace
  never touches the expiring user token.

## Steps

1. **`lib/session.ts`** — the entire "user system":
   - Session shape: `{ user: { login, name, avatarUrl }, userToken, userTokenExpiresAt, refreshToken, installationId?, repo?: { owner, name } }`.
   - Export `getSession()` (server-only): reads the `session` cookie, decrypts it with `jose` `jwtDecrypt` using `SESSION_SECRET`, returns the shape above or `null`.
   - Export `setSession(data)` and `clearSession()`: encrypt with `jose` `EncryptJWT` (`alg: 'dir'`, `enc: 'A256GCM'`), 30-day expiry, httpOnly, `secure`, `sameSite: 'lax'` cookie named `session`.
   - Encrypt, don't just sign — the cookie holds GitHub tokens, it must not be readable client-side.
   - BYOK/OpenRouter keys do NOT go in this cookie (4KB limit, 99 issue 2) — they get a separate `provider-keys` cookie (12/13).
   - Export `getValidUserToken()`: if `userTokenExpiresAt` is within 60s of now, POST `https://github.com/login/oauth/access_token` with `client_id`, `client_secret`, `grant_type: 'refresh_token'`, `refresh_token` → response carries a NEW access token AND a NEW refresh token (the old refresh token dies on use) — persist both via `setSession` before returning. Refresh token itself expired (6 months) → return null → treat as logged out, user re-auths.

2. **`app/api/auth/github/route.ts`** (GET) — start the flow:
   - Generate a random `state` string AND a PKCE pair (`code_verifier`, `code_challenge` = S256 hash). Store `{ state, verifier, next }` in a short-lived (**30 min** — fresh-account signup + email verification easily exceeds 10 min) httpOnly cookie `oauth_state`. `next` = query param, default `/workspace` (the canonical entry — its guard routes onward, 04; the onboarding screen passes `next=/workspace/start` to resume the chat after OAuth).
   - Redirect to:
     `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${APP_URL}/api/auth/github/callback&state=${state}&code_challenge=${challenge}&code_challenge_method=S256&allow_signup=true`
   - `allow_signup=true` is the default but we set it explicitly — **most teachers won't have a GitHub account**. The authorize screen doubles as their signup ("Create an account"), and the whole thing (signup → email verify → authorize → install) is one continuous bounce chain on GitHub's side. Our UI never adds screens in between: it stays ONE button, "Save my workspace".
   - No `scope` parameter (GitHub Apps ignore it; permissions live on the app).

3. **`app/api/auth/github/callback/route.ts`** (GET) — finish authorization:
   - Read `code` and `state`; compare `state` to the `oauth_state` cookie; mismatch → 400.
   - POST `https://github.com/login/oauth/access_token` with `client_id`, `client_secret`, `code`, `code_verifier`, header `Accept: application/json` → `{ access_token, expires_in: 28800, refresh_token, refresh_token_expires_in }`.
   - GET `https://api.github.com/user` → `{ login, name, avatar_url }`.
   - GET `https://api.github.com/user/installations` with the user token → find the installation whose `account.login === user.login` (personal account). If found, store its `installation_id`.
   - `setSession({ user, userToken, userTokenExpiresAt, refreshToken, installationId? })`, clear `oauth_state`.
   - If NO installation found → redirect to `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new` (user picks their personal account, keeps **All repositories** selected — it's the pre-selected radio, one click, and on a fresh account there's literally nothing else there; it also guarantees the repo we create in 07 is instantly covered. GitHub then bounces them to the app's Setup URL = step 4).
   - If installation found → redirect to `next`.
   - **Important:** do NOT auto-create a repo here. The workspace-creation flow (07) decides that.

4. **`app/api/auth/github/installed/route.ts`** (GET) — the app's Setup URL:
   - GitHub redirects here after install with `?installation_id=…`.
   - Require an existing session (401 → `/api/auth/github`). Verify the `installation_id` appears in `GET /user/installations` for THIS session's user (binds the install to the logged-in account — don't trust the query param alone).
   - Merge `installationId` into the session, redirect to `/workspace`.

5. **`app/api/auth/logout/route.ts`** (POST) — `clearSession()`, return `{ ok: true }`.
   - Note in a code comment: this only clears OUR cookie. Teachers who want to fully revoke access uninstall/Revoke the app in GitHub → Settings → Applications → GitHub Apps (`https://github.com/settings/installations`). Link that in the UI (12).

6. **Test manually**:
   - Browser-visit `/api/auth/github` → GitHub authorize → (first time) install screen → land back on `/workspace`.
   - Add a temporary `console.log` in a server component calling `getSession()` → prints login + `installationId`.
   - Wait/forge expiry → `getValidUserToken()` rotates both tokens, session still valid.
   - Hit `/api/auth/logout` → session gone.

## Done when

- [ ] Full authorize → install round-trip works in the browser, both orders (install-then-authorize not required; our chain is authorize → install)
- [ ] `getSession()` returns GitHub user info + `installationId` after login, `null` after logout
- [ ] Cookie is httpOnly + encrypted (verify: cookie value is a JWE, not readable JSON) and well under 4KB
- [ ] State-mismatch returns 400 (tamper test)
- [ ] Token refresh rotates BOTH tokens and updates the cookie
- [ ] Install callback rejects an `installation_id` not belonging to the session user
- [ ] No repo is created during login (that happens in 07)
