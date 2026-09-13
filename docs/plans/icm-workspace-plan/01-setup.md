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
   - **Repository permissions**: `Contents: Read and write` (tree/read/write files), `Administration: Read and write` (required to create the repo from the template). `Metadata: Read` is added automatically. Nothing else.
   - "Where can this GitHub App be installed?" → **Any account**.
   - After saving: note the **App ID**, generate a **private key** (downloads a `.pem` — base64 it for env), and copy the **Client ID** + generate a **Client secret** (used for the OAuth web flow side of the app).
   - Create a SECOND GitHub App for local dev (callback + setup URL on `http://localhost:3000`) — dev and prod stay separate apps.

4. **Create the template repo** (manual, human does this once):
   - Create a new repo under the NGO's GitHub org, e.g. `icm-teacher-workspace-template`.
   - Fill it with your teacher-tailored ICM structure (numbered stage folders, `CONTEXT.md` files, `setup/questionnaire.md`, `_config/`). Base it on the ICM conventions, but write the stage contracts for teacher workflows (lesson planning, rubrics, feedback…). Use `{{PLACEHOLDER}}` tokens anywhere personalization will go (e.g. `{{TEACHER_NAME}}`, `{{SUBJECT}}`, `{{GRADE_LEVEL}}`, `{{TONE}}`).
   - In repo Settings, tick **"Template repository"** — this unlocks the `/generate` API used in 07.
   - Keep it private-visible: templates can be public; generation into a *private* user repo works from public templates.

5. **Set environment variables** (`.env.local` for dev, Vercel dashboard for prod):
   ```
   GITHUB_APP_ID=...
   GITHUB_APP_SLUG=...                        # url-name of the app, for /apps/<slug>/installations/new
   GITHUB_APP_PRIVATE_KEY=...                 # .pem contents, base64-encoded (single line)
   GITHUB_CLIENT_ID=...                       # the GitHub App's client id (OAuth web flow)
   GITHUB_CLIENT_SECRET=...                   # the GitHub App's client secret
   SESSION_SECRET=<32-byte-random-hex>        # openssl rand -hex 32
   AI_GATEWAY_API_KEY=...                     # from Vercel dashboard → AI Gateway
   TEMPLATE_REPO=<ngo-org>/icm-teacher-workspace-template
   APP_URL=http://localhost:3000              # https://<domain> in prod
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
- [ ] All 9 env vars are set in `.env.local`
- [ ] GitHub App created (dev + prod) with Contents RW + Administration RW, callback + setup URLs noted, private key downloaded
- [ ] Template repo exists, is marked as "Template repository", contains `{{PLACEHOLDER}}` tokens
- [ ] Folder skeleton created, `npm run dev` still boots cleanly
