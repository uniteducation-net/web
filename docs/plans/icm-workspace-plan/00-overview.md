# 00 — Overview: ICM Teacher Workspace

## The final goal (read first, never lose sight of it)

Emerging teachers land on a clean page, chat with an AI that asks a few profile
questions, then click ONE button ("Save my workspace") which connects their
GitHub account and creates a **private repo they own**, seeded with a minimal
ICM workspace (`00-Profile/` + `01-Start Here/`) that the agent grows one
numbered micro-step folder at a time (method conventions read live from the
public https://github.com/RinDig/icm-architect reference, never copied).
After that, they work in a 3-column IDE-like view:

- **Left:** collapsible sidebar — file tree (live from their repo) + Settings + user menu pinned at the bottom
- **Center:** selected file rendered as formatted markdown preview (NO terminal, NO raw code view in v1)
- **Right:** collapsible AI agent chat — the same assistant from onboarding, now able to read/edit files in the repo

## Non-negotiable constraints

- **No database. Ever.** The user's GitHub repo is the state. Sessions are an encrypted cookie.
- **No passwords / no email auth.** GitHub App only (fine-grained permissions: Contents RW + Administration RW), hand-rolled (~4 routes). No Better Auth, no NextAuth.
- **NGO budget ≈ $0.** LLM calls default to Vercel AI Gateway free tier ("AI on us"), with BYOK + OpenRouter OAuth as user options in Settings.
- **Users own everything.** The repo is in THEIR GitHub account, private, created empty and seeded by our pipeline (no template repo).
- **Fresh GitHub accounts are the norm.** Most teachers won't have one — signup happens inside the auth flow (`allow_signup`), still one button. Their repo is `UnitEd-Workspace` ("UnitEd Workspace"); "ICM" stays internal. Complexity lives on our side, never theirs.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, existing project) + Vercel Pro hosting |
| UI | shadcn/ui (already in project) + **Vercel AI Elements** for chat components |
| Chat logic | Vercel AI SDK 7 (`useChat`, `streamText`, tools) — latest major, see https://ai-sdk.dev/docs/introduction |
| LLM | Vercel AI Gateway (default) / user BYOK / OpenRouter OAuth |
| Auth | GitHub App: user access token (8h, refreshable) for identity + repo creation; installation token for repo ops; `jose` encrypted httpOnly cookie session |
| Storage | GitHub REST API (repo creation, contents, git trees; unauthenticated reads of the two public reference repos) |

## The two app states (two routes)

```
STATE 1 — Onboarding (no repo connected yet) → /workspace/start
  Full-screen centered chat. AI asks profile questions. Works anonymously
  (no login needed — "AI on us" via AI Gateway).
  Ends with one button: "Save my workspace" → connect GitHub (authorize + install our GitHub App).

STATE 2 — Workspace (repo exists) → /workspace
  3-column layout: sidebar | markdown preview | agent chat.
  Onboarding conversation slides into the right panel (continuity!).
```

`/workspace` is the canonical entry: it guards and redirects server-side
(no session / no repo → `/workspace/start`). Returning users land directly in
the shell and never load onboarding code. See 04.

## File map (do them in order)

| File | What it builds |
|---|---|
| 01-setup.md | Dependencies, env vars, GitHub App registration |
| 02-auth.md | GitHub App auth routes (authorize → install) + encrypted cookie session |
| 03-github-api.md | Server helpers: octokit client, repo generate, tree, read, write |
| 04-route-group-layout.md | `/workspace` route group + guard: redirects to `/workspace/start` or renders the shell |
| 05-onboarding-chat.md | `/workspace/start`: centered chat UI with AI Elements |
| 06-onboarding-agent.md | The interviewer: system prompt + profile extraction |
| 07-repo-provisioning.md | Create the user's repo and seed `00-Profile/` + `01-Start Here/` (deterministic + one optional LLM pass) |
| 08-workspace-shell.md | State 2: 3-column resizable/collapsible shell |
| 09-file-tree.md | Left sidebar: live file tree from GitHub |
| 10-markdown-preview.md | Center: formatted markdown preview |
| 11-agent-panel.md | Right: agent chat with repo read/write tools + "Save this chat" → `chats/` in the repo |
| 12-settings.md | Settings modal + user menu (BYOK, model, unpair/logout) |
| 13-llm-provider.md | Provider resolution: gateway default / BYOK / OpenRouter OAuth |
| 14-deploy.md | Vercel env, AI Gateway budget cap, final checklist |

## Rules for the coding agent

1. Do the files **in numeric order**. Each file lists its prerequisites.
2. Each file ends with a **"Done when"** checklist — verify all boxes before moving on.
3. Never introduce a database, ORM, or auth library. If a step seems to need one, re-read the file — the answer is the GitHub repo or the cookie.
4. All AI code targets **Vercel AI SDK 7**. Several older APIs were renamed in v7 (`stepCountIs` → `isStepCount`, `initialMessages` → `messages`, `api:` option → `transport: new DefaultChatTransport(...)`) — if a snippet anywhere reads like the old API, check https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0 before writing it.
5. Keep components small. Server Components by default; `'use client'` only where interactivity demands it.
