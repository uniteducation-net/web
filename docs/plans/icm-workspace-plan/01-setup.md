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

3. **Create the GitHub OAuth App** (manual, human does this once):
   - GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   - Homepage URL: `https://<your-domain>`
   - Authorization callback URL: `https://<your-domain>/api/auth/github/callback`
   - Also add `https://localhost:3011/api/auth/github/callback` as a second OAuth App for local dev (GitHub allows one callback per app — use two apps, dev + prod).
   - Requested scope (set in code later): `repo` (needed to create + read + write private repos).

4. **Create the template repo** (manual, human does this once):
   - Create a new repo under the NGO's GitHub org, e.g. `icm-teacher-workspace-template`.
   - Fill it with your teacher-tailored ICM structure (numbered stage folders, `CONTEXT.md` files, `setup/questionnaire.md`, `_config/`). Base it on the ICM conventions, but write the stage contracts for teacher workflows (lesson planning, rubrics, feedback…). Use `{{PLACEHOLDER}}` tokens anywhere personalization will go (e.g. `{{TEACHER_NAME}}`, `{{SUBJECT}}`, `{{GRADE_LEVEL}}`, `{{TONE}}`).
   - In repo Settings, tick **"Template repository"** — this unlocks the `/generate` API used in 07.
   - Keep it private-visible: templates can be public; generation into a *private* user repo works from public templates.

5. **Set environment variables** (`.env.local` for dev, Vercel dashboard for prod):
   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
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
- [ ] All 6 env vars are set in `.env.local`
- [ ] GitHub OAuth App created (dev + prod), callback URLs noted
- [ ] Template repo exists, is marked as "Template repository", contains `{{PLACEHOLDER}}` tokens
- [ ] Folder skeleton created, `npm run dev` still boots cleanly
