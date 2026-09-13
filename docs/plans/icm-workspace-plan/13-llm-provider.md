# 13 — LLM provider resolution (`lib/llm.ts`)

Prerequisites: 01 (`AI_GATEWAY_API_KEY`), 02 (session shape has `byokKey` etc.).

One function decides which model every AI call uses. Onboarding (`/api/chat`)
ALWAYS uses the gateway (anonymous users have no keys). The workspace agent
(`/api/agent`) resolves per session.

## Steps

1. **`resolveModel(session)`** returns an AI SDK 7 model:
   ```
   if session.openrouterKey  → createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey })('openai/gpt-4o-mini' or user-chosen)
   if session.byokKey        → provider factory by session.byokProvider (@ai-sdk/openai / anthropic / google)
   else                      → gateway('google/gemini-2.5-flash')   // "AI on us"
   ```
   Install `@ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google` for BYOK. Provider
   packages version independently of `ai@^7` — just take latest of each.

2. **Free-tier guard for the gateway path**:
   - Daily token ceiling (e.g. 200k tokens/day) via a signed counter cookie `fu` (`{ date, tokens }`).
   - In `/api/agent`: after each response, add `usage.totalTokens` to the counter; before each call, if over ceiling → return a friendly stream error: "Free daily limit reached — add your own key in Settings ⚙ to keep going."
   - Also enforce a hard `maxOutputTokens` (e.g. 2000) on the gateway path.

3. **Model picker (optional, keep tiny)**: a select in Settings with 2–3
   curated cheap models; store choice in the session cookie. Default to the
   cheapest. Resist adding more.

4. **OpenRouter OAuth (PKCE)** — the "connect your AI account" flow:
   - Client-side: generate `code_verifier`/`code_challenge` (S256), stash verifier in `sessionStorage`, redirect to `https://openrouter.ai/auth?callback_url=${APP_URL}/workspace&code_challenge=…&code_challenge_method=S256`.
   - Back in `/workspace`: read `?code=`, POST `https://openrouter.ai/api/v1/auth/keys` with `{ code, code_verifier, code_challenge_method }` → receive a user-controlled API key billed to THEIR OpenRouter account.
   - Send the key to `/api/settings` (12 step 5) → stored in the encrypted session cookie. Never persist it anywhere else.

5. **Error mapping**: provider 401/403 → "Your key seems invalid — update it
   in Settings." Provider 429 → "Rate limited — try again in a moment." Never
   leak provider error bodies to the UI.

## Done when

- [ ] Anonymous onboarding chat works with zero user credentials (gateway only)
- [ ] Agent calls use BYOK/OpenRouter key when set, gateway otherwise
- [ ] Free-tier ceiling blocks politely and Settings shows the way out
- [ ] OpenRouter PKCE round-trip yields a working key stored only in the encrypted cookie
- [ ] Provider errors surface as friendly one-liners
