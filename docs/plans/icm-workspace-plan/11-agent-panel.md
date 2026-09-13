# 11 — Right panel: the agent that works the repo

Prerequisites: 08 (renders `<AgentPanel />`), 09/10 (refreshKey), 03 (GitHub helpers), 13 (`resolveModel`).

The heart of the workspace: the same assistant from onboarding, now with
hands. Chat on the right, edits land in the repo, UI refreshes.

## Steps

1. **`components/workspace/agent-panel.tsx`** (`'use client'`):
   - AI Elements `Conversation` + `Message` + `PromptInput`, `useChat` with
     `transport: new DefaultChatTransport({ api: '/api/agent' })` (same AI SDK 7 pattern as 05).
   - Header: "Assistant" + **"Save this chat" button** (step 5) + collapse button. Footer: the input.
   - Receives `onFilesChanged()` from the shell → bumps `refreshKey` (09 step 3, 10 step 5).

2. **`app/api/agent/route.ts`** (POST):
   - Require session (401 otherwise). Body: `{ messages }` — `UIMessage`s; pass
     `convertToModelMessages(messages)` to `streamText` (same as 06).
   - `streamText` with `model: resolveModel(session)` (13), system prompt (step 3), and **server-side tools** (step 4).
   - `stopWhen: isStepCount(8)` (renamed from `stepCountIs` in AI SDK 7) so the agent can chain read→edit→write without runaway loops.

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

6. **"Save this chat" button** (header of the panel):
   - On click → POST `/api/workspace/save-chat` with the current `messages`.
     Disabled while the chat is empty or a stream is running.
   - On success → toast "Chat saved to `chats/` ✓" and call `onFilesChanged()`
     so the new file appears in the tree (09) and can be opened in the preview (10).
   - This is the answer to "chat history is device-locked" (known issues #6):
     conversations the teacher cares about live in THEIR repo, on every device.

7. **`app/api/workspace/save-chat/route.ts`** (POST):
   - Require session (401 otherwise). Body: `{ messages }` (UIMessages).
   - Format messages into a markdown transcript: `## 👤 You` / `## 🤖 Assistant`
     sections, text parts only — skip tool/data parts (they're noise in a saved transcript).
   - Prepend a small front-matter-ish header: `# Chat — 2026-09-13 14:32` (local date-time).
   - Filename: `chats/2026-09-13-1432-<4-char-random>.md` — date-time for human
     sorting, random suffix so two saves in the same minute never collide.
   - Write via `writeFile` (03 step 6), commit message `"Save chat transcript"`.
     The `chats/` folder needs no scaffolding — GitHub creates it from the path.
   - Return `{ path }` so the client can toast/select it.

8. **Render tool activity in chat**: show a subtle inline status ("Reading
   02-script/CONTEXT.md…", "Updated voice-rules.md ✓") using AI Elements
   `Tool`/`Loader` parts — teachers should see the agent working, not a
   frozen spinner.

9. **Suggested prompts** (AI Elements `Suggestion`, shown when chat is empty):
   - "Run stage 01 with my next lesson topic"
   - "Make my tone rules warmer"
   - "Explain what's in my workspace"
   These teach the mental model better than any onboarding doc.

## Done when

- [ ] "Read file X" → agent reads and summarizes correctly
- [ ] "Rewrite Y in a friendlier tone" → file changes in the repo, preview + tree refresh, commit visible on GitHub
- [ ] Running a stage: agent follows that stage's `CONTEXT.md` and writes to `output/`
- [x] Tool activity visible inline; no raw JSON/base64 ever shown
- [ ] "Save this chat" writes a readable markdown transcript to `chats/` in the repo; tree refreshes and the file opens in the preview
- [ ] Two saves within the same minute produce two distinct files (random suffix)
- [ ] Agent stops after ≤8 tool steps; no infinite loops
- [x] Empty-chat suggestions render and work

> **Status (UI-only pass, 2026-09-13):** Panel renders a static mock
> conversation with inline tool-activity rows; "New chat" clears to the empty
> state where the 3 suggestions appear — clicking one submits locally and gets
> one canned reply after a short delay. "Save this chat" button renders
> disabled. No `useChat`, no `/api/agent` route, no tools, no files-changed
> refresh — pending 03/13. AI Elements `Conversation`/`Message`/
> `PromptInput`/`Suggestion` are installed; `Tool` was removed for lint
> (re-add with `pnpm dlx shadcn add
> https://elements.ai-sdk.dev/api/registry/tool.json` when wiring the real
> stream).
