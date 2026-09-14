import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type InferUIMessageChunk,
  type UIMessage,
} from "ai";
import { gateway } from "@ai-sdk/gateway";
import {
  ONBOARDING_SYSTEM_PROMPT,
  WRAP_UP_SUFFIX,
  createProfileStreamFilter,
} from "@/lib/onboarding";
import type { OnboardingUIMessage } from "@/app/(app)/workspace/start/_lib/onboarding-chat";

// Cost guard (06 step 5): past this many messages the interviewer is told to
// wrap up immediately and emit whatever partial profile it has (nulls for
// missing fields — 07 tolerates that). Still exactly one model call.
const MAX_MESSAGES = 24;

// Abuse guards (security review 2026-09-14): this route is anonymous and
// bills the NGO's AI Gateway key, and both message count and content are
// fully client-controlled — so cap them hard, independent of the wrap-up
// UX above. The Vercel WAF rate limit (14 step 2) is the per-IP layer.
const HARD_MAX_MESSAGES = 64;
const MAX_INPUT_CHARS = 64_000; // ≈16k tokens worst case, way past a real interview

export async function POST(req: Request) {
  // "AI on us" via the AI Gateway free tier — anonymous-friendly, and this
  // one key is the only credential this route needs. Fail with a clear
  // error, never crash, when it is missing.
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      {
        error:
          "Chat is not configured yet: AI_GATEWAY_API_KEY is missing. See docs/plans/icm-workspace-plan/01-setup.md.",
      },
      { status: 503 },
    );
  }

  let messages: UIMessage[];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages)) throw new Error("messages missing");
    messages = body.messages;
  } catch {
    return Response.json(
      { error: "Bad request: expected { messages }." },
      { status: 400 },
    );
  }

  if (messages.length > HARD_MAX_MESSAGES) {
    return Response.json(
      { error: "Too many messages — start a new conversation." },
      { status: 400 },
    );
  }
  if (JSON.stringify(messages).length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: "Conversation too large." },
      { status: 413 },
    );
  }

  const overLong = messages.length > MAX_MESSAGES;

  const result = streamText({
    model: gateway("google/gemini-2.5-flash"),
    system: overLong ? ONBOARDING_SYSTEM_PROMPT + WRAP_UP_SUFFIX : ONBOARDING_SYSTEM_PROMPT,
    maxOutputTokens: 400, // interview replies are short
    messages: await convertToModelMessages(messages),
  });

  const stream = createUIMessageStream<OnboardingUIMessage>({
    execute({ writer }) {
      // Strip the ```profile block from the visible text and re-emit it as a
      // persistent `data-profile` part (id => reconciled into message.parts),
      // which is what lights up the save button on the client (05 step 5).
      const filter = createProfileStreamFilter((profile) => {
        writer.write({
          type: "data-profile",
          id: "profile",
          data: { complete: true, profile },
        });
      });
      writer.merge(
        toUIMessageStream({ stream: result.stream }).pipeThrough(
          filter,
        ) as ReadableStream<InferUIMessageChunk<OnboardingUIMessage>>,
      );
    },
    onError: (error) =>
      error instanceof Error && error.name === "GatewayAuthenticationError"
        ? "AI Gateway rejected the API key (401). Regenerate AI_GATEWAY_API_KEY in the Vercel dashboard and restart the dev server."
        : "The assistant hit an unexpected error. Please try again.",
  });

  return createUIMessageStreamResponse({ stream });
}
