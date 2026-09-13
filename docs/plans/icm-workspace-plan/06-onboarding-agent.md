# 06 — The interviewer: `/api/chat` route

Prerequisites: 01 (env: `AI_GATEWAY_API_KEY`), 05 (UI posts here).

This is "AI on us": anonymous-friendly, billed to the NGO's AI Gateway free
tier. Keep it cheap — short system prompt, cheap model, capped output.

## Steps

1. **`app/api/chat/route.ts`** (POST):
   - Body: `{ messages }` from `useChat`.
   - Call `streamText` with:
     - `model: gateway('google/gemini-2.5-flash')` (or cheapest free-tier-eligible model available in your Gateway — check the dashboard)
     - `system: ONBOARDING_SYSTEM_PROMPT` (step 2)
     - `maxOutputTokens: 400` (interview replies are short)
   - Return `result.toUIMessageStreamResponse()`.

2. **`lib/onboarding.ts`** — the system prompt. Rules it must encode:
   - You are interviewing an emerging teacher to personalize their ICM workspace.
   - Collect EXACTLY these fields, conversationally, max ~5 exchanges total: `name`, `subject`, `gradeLevel`, `teachingContext` (school type / country), `tone` (how they want materials to sound), `goals` (one sentence).
   - Ask at most 2 questions per message. Be warm, brief, no jargon, never mention "ICM", "repos", or "templates".
   - When all fields are collected, say a short wrap-up line and emit the profile JSON (step 3).
   - NEVER invent answers — if a field is missing, ask.

3. **Profile emission format**: instruct the model to end its final message
   with a fenced block:
   ````
   ```profile
   {"name":"…","subject":"…","gradeLevel":"…","teachingContext":"…","tone":"…","goals":"…"}
   ```
   ````

4. **Parse + signal**: in the route's stream transform, detect the
   ```profile block. When present:
   - Strip the block from the visible text (teachers shouldn't see raw JSON).
   - Validate it against a zod schema (`TeacherProfile`).
   - If valid, append a UIMessage data part: `{ type: 'data-profile', data: { complete: true, profile } }` — this is what 05 step 5 uses to light up the save button.

5. **Cost guards**:
   - Cap conversation length server-side: if `messages.length > 24`, tell the user to wrap up and show the save button anyway with whatever partial profile exists (mark missing fields `null`; 07 must tolerate that).
   - No retry loops. One model call per user message.

## Done when

- [ ] Chat interviews naturally and finishes in ≤5 exchanges for a cooperative user
- [ ] Final message contains no visible JSON in the UI
- [ ] UI receives the `data-profile` part and the save button enables
- [ ] Over-long conversations get cut off gracefully
- [ ] One AI Gateway key is the only credential involved (check: no BYOK needed for this route)
