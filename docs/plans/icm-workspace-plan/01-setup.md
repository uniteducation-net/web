# 01 — Setup

Prerequisites: none. Do this first.

## Steps

1. **Install dependencies** into the existing Next.js + shadcn project:
   ```bash
   npm install ai@^7 @ai-sdk/react @ai-sdk/gateway jose octokit   # Vercel AI SDK 7
   npm install react-markdown remark-gfm
   ```
   Do NOT install `@assistant-ui/*` — AI Elements' `response` component
   (Streamdown-based) already renders markdown inside chat bubbles; assistant-ui
   is a separate chat library we don't use.

2. **Install AI Elements** (shadcn-registry style, components copy into `components/ai-elements/`):
   ```bash
   npx ai-elements@latest
   ```
   When prompted, install at minimum: `conversation`, `message`, `prompt-input`, `loader`, `suggestion`, `response`.

3. **Create the GitHub App** (manual, human does this once — we use a GitHub
   App, NOT an OAuth App; fine-grained permissions, see 99 issue 1):
   - GitHub → Settings → Developer settings → **GitHub Apps** → New GitHub App
   - Homepage URL: `https://<your-domain>`
   - Callback URL: `https://<your-domain>/api/auth/github/callback`
   - **Post installation → Setup URL**: `https://<your-domain>/api/auth/github/installed` (leave "Redirect on update" unchecked)
   - Do NOT enable "Request user authorization (OAuth) during installation" — we chain authorize → install ourselves so we keep control of `redirect_uri` and CSRF `state` (02).
   - Webhook: uncheck "Active" (v1 needs no webhooks).
   - **Repository permissions**: `Contents: Read and write` (tree/read/write files), `Administration: Read and write` (was required to create repos from a template — template generation is gone since the 2026-09-14 rebuild, so this permission may no longer be needed; **verify before dropping**). `Metadata: Read` is added automatically. Nothing else.
   - "Where can this GitHub App be installed?" → **Any account**.
   - After saving: note the **App ID**, generate a **private key** (downloads a `.pem` — base64 it for env), and copy the **Client ID** + generate a **Client secret** (used for the OAuth web flow side of the app).
   - Create a SECOND GitHub App for local dev (callback + setup URL on `http://localhost:3000`) — dev and prod stay separate apps.

4. **No template repo anymore** (nothing to do here — kept as a step so old references make sense):
   - The workspace repo is created nearly empty (`auto_init`) and seeded by the provisioning pipeline (07) — there is no NGO-owned template, no `/generate`, no `{{PLACEHOLDER}}` tokens.
   - `uniteducation-net/Resources` is the seeded public curated-resources repo (`CONTEXT.md` contract, `README.md` human index, `resources/*.md` with wikilinks) — it already exists, no setup needed.
   - `RinDig/icm-architect` is the public method reference, read live at its latest version (never copied) — no setup needed.

5. **Set environment variables** (`.env.local` for dev, Vercel dashboard for prod):
   ```
   GITHUB_APP_ID=...
   GITHUB_APP_SLUG=...                        # url-name of the app, for /apps/<slug>/installations/new
   GITHUB_APP_PRIVATE_KEY=...                 # .pem contents, base64-encoded (single line)
   GITHUB_CLIENT_ID=...                       # the GitHub App's client id (OAuth web flow)
   GITHUB_CLIENT_SECRET=...                   # the GitHub App's client secret
   SESSION_SECRET=<32-byte-random-hex>        # openssl rand -hex 32
   AI_GATEWAY_API_KEY=...                     # from Vercel dashboard → AI Gateway
   APP_URL=http://localhost:3000              # https://<domain> in prod
   # Optional — repo provisioning (defaults built into lib/public-github.ts):
   RESOURCES_REPO=uniteducation-net/Resources # public curated-resources repo (already seeded)
   ICM_REFERENCE_REPO=RinDig/icm-architect    # public method reference, read live
   RESOURCES_INSTALLATION_ID=...              # app installation on the org → 5,000 req/h instead of 60/h/IP for public reads
   ```

6. **Create the folder skeleton**:
   ```
   app/
     workspace/
       layout.tsx
       page.tsx
     api/
       auth/github/route.ts
       auth/github/callback/route.ts
       auth/github/installed/route.ts
       auth/logout/route.ts
       chat/route.ts
       agent/route.ts
       workspace/create/route.ts
       workspace/tree/route.ts
       workspace/file/route.ts
       workspace/save-chat/route.ts
   lib/
     session.ts
     github.ts
     llm.ts
     onboarding.ts
   components/
     workspace/        # shell, tree, preview, agent panel
     onboarding/
   ```

## Done when

- [ ] `npx ai-elements@latest` components exist under `components/ai-elements/`
- [ ] All 8 required env vars are set in `.env.local` (the 3 repo-provisioning vars are optional, defaults built in)
- [ ] GitHub App created (dev + prod) with Contents RW (+ Administration RW pending the drop-verification above), callback + setup URLs noted, private key downloaded
- [x] No template repo needed — Resources is seeded and public, icm-architect is read live (both verified reachable unauthenticated)
- [ ] Folder skeleton created, `npm run dev` still boots cleanly
