# 05 — Onboarding screen: centered chat UI at `/workspace/start`

Prerequisites: 01 (AI Elements installed), 04 (route + guard exist).

The first thing a teacher ever sees, served at `/workspace/start` (04).
Extremely simple and clean: logo, one chat, nothing else.

## Steps

1. **`app/(app)/workspace/start/_components/onboarding-screen.tsx`** (`'use client'`)
   — co-located under the route (route-specific per project rules); the page
   itself (`start/page.tsx`) stays a thin Server Component that passes the
   `authenticated` flag (04 step 3):
   - Layout: full-height flex column, centered, `max-w-2xl mx-auto`.
   - Top: small logo + one-line tagline ("Your personal teaching workspace, built in a 2-minute chat"). Nothing else. No menus, no links.
   - Middle: AI Elements `<Conversation>` + `<Message>` list.
   - Bottom: AI Elements `<PromptInput>` (single input, send button, Enter to send).
   - Use `useChat` from `@ai-sdk/react` (AI SDK 7) with an explicit transport:
     `useChat({ transport: new DefaultChatTransport({ api: '/api/chat' }) })`
     (`DefaultChatTransport` comes from `ai`). Send with `sendMessage({ text })`
     — input state is managed manually via `useState` in AI SDK 5+. The route is built in 06.

2. **Opening message**: render a seeded assistant first message so the screen
   never looks empty: *"Hi! I'm going to build your personal teaching workspace.
   Three quick questions — first, what do you teach, and to whom?"*
   (Pass it via the `messages` option of `useChat` — renamed from
   `initialMessages` in AI SDK 5+ — as a `UIMessage` with a `parts` array,
   not a fake API call.)

3. **Persist the draft conversation client-side**: on every message change,
   save `messages` to `localStorage` under `onboarding-chat`. On mount,
   restore it. This is what lets the OAuth round-trip (02) lose nothing.
   localStorage is ONLY a draft buffer for this anonymous phase — once the
   workspace exists, durable chat history lives in the repo via "Save this
   chat" (11, steps 6–7).

4. **The save button**: render a prominent button BELOW the input (or as a
   sticky suggestion chip) whose label depends on auth (the `authenticated`
   flag from the page):
   - Logged out → **"Save my workspace — connect GitHub"** → `window.location = '/api/auth/github?next=/workspace/start'` (returns here after the OAuth round-trip, 04 step 4)
   - Logged in, no repo → **"Create my workspace"** → POST `/api/workspace/create` with the conversation's extracted profile (07), then hard-navigate to `/workspace` (the guard now finds the repo and renders the shell).
   - Only enable it once the interviewer has collected the required profile fields (06 signals this — see step 5).

5. **Readiness signal**: the chat API response includes a UIMessage data part
   `{ type: 'data-profile', data: { complete: true, profile } }` when the
   interviewer is done (06, step 4). The screen reads it and
   enables/highlights the save button.

6. **Micro-copy**: under the button, one gray line:
   *"Creates a private repo in YOUR GitHub account. You own everything."*
   Trust matters for teachers; say it plainly.

## Done when

- [ ] Screen is visually clean: logo, chat, input, one button — nothing else
- [ ] Chat streams responses via `/api/chat`
- [ ] Refresh mid-conversation → full conversation restored from localStorage
- [ ] OAuth round-trip returns to the SAME conversation, button now says "Create my workspace"
- [ ] Button disabled until the `data-profile` part with `complete: true` arrives
- [ ] Mobile: works at 375px width without horizontal scroll

> **Status (UI-only pass, 2026-09-13):** Screen built at
> `src/app/(app)/workspace/start/` with a scripted mock interview
> (`_lib/mock-onboarding.ts`) — no `/api/chat` yet, so streaming stays
> unchecked. localStorage draft persistence works; the save button enables
> after the mock profile completes and, in preview mode, navigates to
> `/workspace/demo` instead of OAuth. `authenticated` is hardcoded `false`
> in the page until 04 wires the session.
