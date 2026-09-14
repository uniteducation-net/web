# Known Issues & Fixes — ICM Teacher Workspace Plan

Companion to plans 00–14. Severity: 🔴 fix before building · 🟠 fix during build · 🟡 acceptable risk, mitigate cheaply.

---

## ✅ 1. GitHub `repo` scope is too broad — **DECIDED: GitHub App**

**Problem (original):** Plan 02 requested OAuth scope `repo` = read/write access
to ALL of a teacher's repos, public and private. GitHub's consent screen shows
this prominently. Privacy-conscious teachers (our exact audience) would bounce.

**Decision (2026-09-13, folded into plans 00/01/02/03/07/12/14):** GitHub App
with fine-grained permissions instead of an OAuth App:
- Permissions: `Contents: read & write` + `Administration: read & write` (Admin
  was required for template-repo generation into a personal account — template
  generation is gone since the 2026-09-14 rebuild, so Administration may be
  droppable; **verify before removing**, see 01 step 3), nothing else
- Auth chain: OAuth web flow (user access token, 8h + 6-month refresh token,
  rotated on refresh) → app installation on the user's personal account
- Repo creation uses the USER token (installation tokens can't create repos in
  personal accounts — serverToServer is orgs-only, confirmed in GitHub docs +
  community); all steady-state repo ops use the INSTALLATION token minted
  on demand from the app private key (1h TTL, no refresh in the cookie)
- Residual trust note: install defaults to "All repositories" (needed so the
  repo we create after install is covered). The consent screen still shows
  exact per-permission access, tokens are short-lived, and access is revocable
  per-app — strictly better than `repo` scope. Safety net for "Only select
  repositories" installers: coverage check + fix link (03 step 8).

## 🔴 2. Session cookie can exceed the 4KB browser limit

**Problem:** Plan 02/12/13 stuff GitHub token + user info + BYOK key +
OpenRouter key into ONE encrypted cookie. JWE encryption inflates size
(~1.5–2x). Browsers hard-cap cookies at 4KB — over the limit, the cookie
**silently fails to set** and users get logged out at random.

**Fix:**
- Keep the session cookie minimal: user info + user token pair + `installationId` only (still well under 1KB encrypted; repo ops use installation tokens minted on demand, never stored)
- Store BYOK/OpenRouter keys in a SEPARATE cookie (`provider-keys`)
- Never store chat state, settings, or profile data in cookies
- **Affects:** 02 (step 1), 12 (step 5), 13 (step 4)

## 🔴 3. Anonymous `/api/chat` is an open wallet

**Problem:** Plan 06 serves "AI on us" with zero authentication. Anyone can
script requests and burn the $5/month AI Gateway budget. The cookie-based
fair-use counter (12 step 6) is trivially bypassed by clearing cookies.
When the budget dies, free AI dies for ALL teachers until month reset.

**Fix (layered):**
- Vercel Firewall / WAF rate limiting by IP on `/api/chat` (dashboard config, no code)
- Keep the AI Gateway hard budget cap as the final backstop (14 step 2)
- Require GitHub login for the AGENT route (already the case) — only the short
  onboarding chat stays anonymous
- **Affects:** 06 (add step), 13 (step 2), 14 (step 2)

## 🟠 4. Workspace detection by repo name is fragile — **MITIGATED (2026-09-14)**

**Problem:** Plan 03 (`findExistingWorkspace`) matches repos by name prefix
`icm-workspace`. A teacher who renames their repo gets shown onboarding
again or a duplicate repo gets created.

**Status (shipped):**
- Session `repo` remains the primary lookup (unchanged) — stored in the cookie
  at creation time, verified with one cheap `GET` per request
- Fallback prefix scan now matches BOTH the current `UnitEd-Workspace` and the
  legacy pre-rename `united-workspace` prefixes (plus the description marker),
  so repos created by earlier deploys are still found
- The rename-proof topic marker (`template_repository` metadata / topics from
  the original fix sketch) was NOT implemented — no longer applicable anyway
  (no template repo); pre-launch, low stakes
- **Affects:** 03 (step 3), 07 (step 1)

## ✅ 5. One-shot LLM personalization can truncate — **RESOLVED by deletion (2026-09-14)**

**Problem (original):** Plan 07 personalizes ALL template files in a single 4,000-token
`generateText` call. Larger templates silently truncate → half-written files
committed to a teacher's repo.

**Resolution:** the personalization pass was deleted along with the template
repo (no `{{PLACEHOLDER}}` replacement anywhere). The only remaining
provisioning LLM call is the Start Here pass
(`lib/provisioning.ts#generateStartHere`, `maxOutputTokens: 2000`), which
writes exactly two files, validates the exact path set, and falls back to
complete deterministic content on every failure mode — truncation can no
longer commit half-written files.

## 🟠 6. Chat history is device-locked → **SOLVED by design**

**Problem:** No DB = conversation lives in localStorage. Teacher switches
laptop → agent has amnesia while the repo is fine. Files are the memory;
the conversation is not.

**Fix (shipped in plan 11, steps 6–7):** a **"Save this chat"** button in the
agent panel header writes the transcript as markdown to `chats/YYYY-MM-DD-HHmm-<rand>.md`
in the teacher's own repo. History travels with the workspace, on every
device, owned by the user — no database needed.
- Saved chats appear in the file tree and render in the preview like any other file
- localStorage remains only a *draft* buffer for the anonymous onboarding round-trip
- **Affects:** 05 (step 3), 11 (steps 6–7)

## 🟡 7. No diff/approval on agent writes

**Problem:** Plan 11 lets the agent edit files directly. Teachers won't read
git history to catch a bad rewrite.

**Fix:** After each agent turn that wrote files, show a summary card in chat:
"3 files changed: voice-rules.md, 02-script/CONTEXT.md… — View diff on GitHub ↗"
(deep link to the commit). Full approval flow = v2.
**Affects:** 11 (step 5)

## 🟡 8. Serverless timeouts on long agent runs — **MITIGATED (2026-09-14)**

**Problem:** The 8-step agent loop and provisioning ride close to function
execution limits. A timeout during provisioning could orphan a half-made repo.

**Status (shipped):**
- `export const maxDuration = 300` on `/api/agent` and
  `/api/workspace/create` (Vercel Pro allows it)
- The rebuilt pipeline is much lighter: no template fetch/copy, at most ONE
  LLM call (Start Here, fair-use-gated), two commits
- Provisioning is split into idempotent, independently committed stages —
  the profile commits FIRST, Start Here second — so a mid-flight failure
  leaves resumable state and a re-POST finishes exactly what's missing (07
  steps 2–4). No client-side split needed.
- **Affects:** 07, 11 (step 2)

## 🟡 9. Privacy: teacher data flows through third-party LLMs

**Problem:** Anonymous onboarding (Gemini free tier via Gateway) may use
inputs for model training. Teachers discussing students = disclosure
obligation, potentially a legal problem for EU schools (GDPR).

**Fix:**
- One-line disclosure under the chat input: "Messages are processed by AI
  providers — don't share student personal data."
- Prefer gateway models with zero-retention/zero-training terms where
  available; note the choice in Settings
- **Affects:** 05 (step 6 micro-copy), 13 (step 1 model choice)

## 🟡 10. Unauthenticated public reads share Vercel's IP rate budget

**Problem (added 2026-09-14):** provisioning and the agent read the public
Resources and icm-architect repos UNAUTHENTICATED — 60 req/h **per IP**, and
Vercel serverless functions share egress IPs, so one noisy neighbor on the
same IP can exhaust the budget for everyone on it.

**Mitigations (shipped, `lib/public-github.ts` + `lib/resources.ts`):**
- Module-level caches: 5 min for trees/files/Resources index, 1 h for the
  ICM reference — steady-state traffic stays far below the budget
- 60 s negative caching: a rate-limited/empty read is cached as null so a
  burn doesn't amplify itself, and a repo being seeded is picked up quickly
- In-band degradation: every expected miss (404, empty-repo 409, rate limit)
  returns null — provisioning falls back to deterministic content and the
  agent proceeds without resources; these repos never fail a request
- Escape hatch: set `RESOURCES_INSTALLATION_ID` (app installed on the org) to
  read with an installation token → 5,000 req/h (01 step 5)
- **Affects:** 07 (step 4), 11 (agent tools), 03 (step 10)

---

## Priority summary

| # | Issue | Severity | Fix effort |
|---|---|---|---|
| 1 | Broad `repo` OAuth scope | ✅ decided | GitHub App + fine-grained perms (00/01/02/03) |
| 2 | 4KB cookie overflow | 🔴 | Small (split cookies) |
| 3 | Anonymous endpoint abuse | 🔴 | Small (WAF config) |
| 4 | Fragile repo detection | 🟠 mitigated | Small |
| 5 | Truncating personalization | ✅ resolved | Deleted with the template repo |
| 6 | Device-locked history | ✅ solved | Small (save-chat button, 11 steps 6–7) |
| 7 | No write visibility | 🟡 | Small |
| 8 | Function timeouts | 🟡 mitigated | Small |
| 9 | LLM data privacy | 🟡 | Copy change |
| 10 | Public reads share IP rate budget | 🟡 mitigated | Small (caches + degradation + installation escape hatch) |
