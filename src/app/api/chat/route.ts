import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { gateway } from "@ai-sdk/gateway";

// TODO(06-onboarding-agent): this is the minimal streaming route 05's UI
// needs. 06 replaces INTERIM_SYSTEM_PROMPT with ONBOARDING_SYSTEM_PROMPT
// from src/lib/onboarding.ts, parses the ```profile block out of the reply,
// and appends the `data-profile` UIMessage data part that lights up the
// save button (05 step 5) — plus the cost guards (06 step 5).
const INTERIM_SYSTEM_PROMPT = [
  "You are interviewing an emerging teacher to personalize their teaching workspace.",
  "Ask short, warm, plain-language questions — at most 2 per message — to learn:",
  "their name, subject, grade level, teaching context (school type / country),",
  "preferred tone for materials, and one goal for this year.",
  "Never mention ICM, repos, templates, or anything technical.",
].join(" ");

export async function POST(req: Request) {
  // "AI on us" via the AI Gateway free tier — anonymous-friendly, one
  // credential. Fail with a clear error, never crash, when it is missing.
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

  const result = streamText({
    model: gateway("google/gemini-2.5-flash"),
    system: INTERIM_SYSTEM_PROMPT,
    maxOutputTokens: 400, // interview replies are short
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
