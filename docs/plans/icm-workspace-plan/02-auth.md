# 02 — Auth: hand-rolled GitHub OAuth + encrypted cookie session

Prerequisites: 01 done. **No auth library. No database.** ~3 small files.

## Steps

1. **`lib/session.ts`** — the entire "user system":
   - Export `getSession()` (server-only): reads the `session` cookie, decrypts it with `jose` `jwtDecrypt` using `SESSION_SECRET`, returns `{ githubToken, user: { login, name, avatarUrl }, repo?: { owner, name }, byokKey?, byokProvider? } | null`.
   - Export `setSession(data)` and `clearSession()`: encrypt with `jose` `EncryptJWT` (`alg: 'dir'`, `enc: 'A256GCM'`), 30-day expiry, write as httpOnly, `secure`, `sameSite: 'lax'` cookie named `session`.
   - Encrypt, don't just sign — the cookie holds a GitHub access token, it must not be readable client-side.

2. **`app/api/auth/github/route.ts`** (GET) — start the flow:
   - Generate a random `state` string, store it in a short-lived (10 min) httpOnly cookie `oauth_state`.
   - Read `next` query param (where to return after login, default `/workspace`), store it in the same cookie value as JSON.
   - Redirect to:
     `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${APP_URL}/api/auth/github/callback&scope=repo&state=${state}`

3. **`app/api/auth/github/callback/route.ts`** (GET) — finish the flow:
   - Read `code` and `state` from query params. Compare `state` to the `oauth_state` cookie; mismatch → 400.
   - POST `https://github.com/login/oauth/access_token` with `client_id`, `client_secret`, `code`, header `Accept: application/json`. Get back `access_token`.
   - Use the token to GET `https://api.github.com/user` → `{ login, name, avatar_url }`.
   - `setSession({ githubToken, user })`, clear `oauth_state` cookie.
   - Redirect to the `next` path stored in step 2.
   - **Important:** do NOT auto-create a repo here. The workspace-creation flow (07) decides that.

4. **`app/api/auth/logout/route.ts`** (POST) — `clearSession()`, return `{ ok: true }`.
   - Note in a code comment: this only clears OUR cookie. Teachers who want to fully revoke access can do it in GitHub → Settings → Applications. Link that in the UI later (12).

5. **Test manually**:
   - `curl` or browser-visit `/api/auth/github` → should bounce to GitHub → authorize → land back on `/workspace`.
   - Add a temporary `console.log` in a server component calling `getSession()` → should print your GitHub login.
   - Hit `/api/auth/logout` → session gone.

## Done when

- [ ] Full OAuth round-trip works in the browser
- [ ] `getSession()` returns GitHub user info after login, `null` after logout
- [ ] Cookie is httpOnly + encrypted (verify: cookie value is a JWE, not readable JSON)
- [ ] State-mismatch returns 400 (tamper test)
- [ ] No repo is created during login (that happens in 07)
