# 11 — Right panel: the agent that works the repo

Prerequisites: 08 (renders `<AgentPanel />`), 09/10 (refreshKey), 03 (GitHub helpers), 13 (`resolveModel`).

The heart of the workspace: the same assistant from onboarding, now with
hands. Chat on the right, edits land in the repo, UI refreshes.

## Steps

1. **`components/workspace/agent-panel.tsx`** (`'use client'`):
   - AI Elements `Conversation` + `Message` + `PromptInput`, `useChat` pointed at `/api/agent`.
   - Header: "Assistant" + collapse button. Footer: the input.
   - Receives `onFilesChanged()` from the shell → bumps `refreshKey` (09 step 3, 10 step 5).

2. **`app/api/agent/route.ts`** (POST):
   - Require session (401 otherwise). Body: `{ messages }`.
   - `streamText` with `model: resolveModel(session)` (13), system prompt (step 3), and **server-side tools** (step 4).
   - `stopWhen: stepCountIs(8)` so the agent can chain read→edit→write without runaway loops.

3. **Agent system prompt** (`lib/agent.ts`):
   - You are the teacher's workspace assistant. Their ICM workspace lives in a GitHub repo you access via tools.
   - ICM basics baked in: numbered stage folders, each stage has `CONTEXT.md` (contract), `references/`, `output/`; stage N's output is stage N+1's input; humans review between stages.
   - Behavior: explain briefly what you'll do, do it with tools, then summarize what changed in plain language. Never dump raw JSON or base64 into chat.
   - When running a stage, follow that stage's `CONTEXT.md` contract (read it first with the tool).
   - Always write with clear commit messages. Never delete files unless explicitly asked and confirmed.

4. **Tools** (AI SDK `tool()` with zod inputs, executed server-side):
   - `listFiles` → `getTree`
   - `readFile({ path })` → `readFile`
   - `writeFile({ path, content, message })` → `writeFile` (fetch current sha first if the file exists)
   - That's it for v1. Three tools. No shell, no search, no deployments.

5. **Detect writes → refresh UI**: in the stream, after any `writeFile`
   tool result, append a data part `{ type: 'data-files-changed', paths: [...] }`.
   The panel listens and calls `onFilesChanged()`.

6. **Render tool activity in chat**: show a subtle inline status ("Reading
   02-script/CONTEXT.md…", "Updated voice-rules.md ✓") using AI Elements
   `Tool`/`Loader` parts — teachers should see the agent working, not a
   frozen spinner.

7. **Suggested prompts** (AI Elements `Suggestion`, shown when chat is empty):
   - "Run stage 01 with my next lesson topic"
   - "Make my tone rules warmer"
   - "Explain what's in my workspace"
   These teach the mental model better than any onboarding doc.

## Done when

- [ ] "Read file X" → agent reads and summarizes correctly
- [ ] "Rewrite Y in a friendlier tone" → file changes in the repo, preview + tree refresh, commit visible on GitHub
- [ ] Running a stage: agent follows that stage's `CONTEXT.md` and writes to `output/`
- [ ] Tool activity visible inline; no raw JSON/base64 ever shown
- [ ] Agent stops after ≤8 tool steps; no infinite loops
- [ ] Empty-chat suggestions render and work
