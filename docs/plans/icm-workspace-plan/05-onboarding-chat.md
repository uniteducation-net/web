# 05 — Onboarding screen: centered chat UI

Prerequisites: 01 (AI Elements installed), 04 (screen is rendered).

The first thing a teacher ever sees. Extremely simple and clean: logo,
one chat, nothing else.

## Steps

1. **`components/onboarding/onboarding-screen.tsx`** (`'use client'`):
   - Layout: full-height flex column, centered, `max-w-2xl mx-auto`.
   - Top: small logo + one-line tagline ("Your personal teaching workspace, built in a 2-minute chat"). Nothing else. No menus, no links.
   - Middle: AI Elements `<Conversation>` + `<Message>` list.
   - Bottom: AI Elements `<PromptInput>` (single input, send button, Enter to send).
   - Use `useChat` from `@ai-sdk/react` pointed at `/api/chat` (built in 06).

2. **Opening message**: render a seeded assistant first message so the screen
   never looks empty: *"Hi! I'm going to build your personal teaching workspace.
   Three quick questions — first, what do you teach, and to whom?"*
   (Implement as the initial message in `useChat`, not a fake API call.)

3. **Persist the draft conversation client-side**: on every message change,
   save `messages` to `localStorage` under `onboarding-chat`. On mount,
   restore it. This is what lets the OAuth round-trip (02) lose nothing.

4. **The save button**: render a prominent button BELOW the input (or as a
   sticky suggestion chip) whose label depends on auth:
   - Logged out → **"Save my workspace — connect GitHub"** → `window.location = '/api/auth/github?next=/workspace'`
   - Logged in, no repo → **"Create my workspace"** → POST `/api/workspace/create` with the conversation's extracted profile (07), then hard-navigate to `/workspace` (state machine now renders the shell).
   - Only enable it once the interviewer has collected the required profile fields (06 signals this — see step 5).

5. **Readiness signal**: the chat API response includes a data part
   `profile-complete: true` when the interviewer is done (06, step 4).
   The screen reads it and enables/highlights the save button.

6. **Micro-copy**: under the button, one gray line:
   *"Creates a private repo in YOUR GitHub account. You own everything."*
   Trust matters for teachers; say it plainly.

## Done when

- [ ] Screen is visually clean: logo, chat, input, one button — nothing else
- [ ] Chat streams responses via `/api/chat`
- [ ] Refresh mid-conversation → full conversation restored from localStorage
- [ ] OAuth round-trip returns to the SAME conversation, button now says "Create my workspace"
- [ ] Button disabled until `profile-complete` signal arrives
- [ ] Mobile: works at 375px width without horizontal scroll
