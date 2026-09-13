// 11 — the workspace agent endpoint. Session-gated (401/409 like the other
// workspace routes): the assistant from onboarding, now with repo read/write
// tools (lib/agent.ts) executed server-side against the session's
// installation token. stopWhen caps tool-call rounds at 8 so read→edit→write
// chains can't run away. After every writeFile tool result the stream emits
// a transient `data-files-changed` part (11 step 5) so the panel refreshes
// the tree (09) and preview (10).
// Plan: docs/plans/icm-workspace-plan/11-agent-panel.md

import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type InferUIMessageChunk,
} from "ai";
import { getSession } from "@/lib/session";
import {
  activeProvider,
  friendlyProviderError,
  GATEWAY_MAX_OUTPUT_TOKENS,
  resolveModel,
} from "@/lib/llm";
import {
  FREE_TIER_DAILY_TOKEN_LIMIT,
  getFairUse,
} from "@/lib/fair-use";
import {
  AGENT_MAX_STEPS,
  AGENT_SYSTEM_PROMPT,
  createWorkspaceTools,
} from "@/lib/agent";
import type { AgentUIMessage } from "@/components/workspace/agent-chat";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (!session.installationId || !session.repo) {
    // The /workspace guard (04) normally prevents this state entirely.
    return Response.json({ error: "no_workspace" }, { status: 409 });
  }

  // 13 — provider resolution. BYOK/OpenRouter sessions spend their own keys;
  // the gateway free tier ("AI on us") is the only path that needs our key
  // and the fair-use guard.
  const onGateway = activeProvider(session) === "gateway";
  if (onGateway && !process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      {
        error:
          "The assistant is not configured yet: AI_GATEWAY_API_KEY is missing. See docs/plans/icm-workspace-plan/01-setup.md.",
      },
      { status: 503 },
    );
  }

  // 13 step 2 — daily free-tier ceiling, checked before the call. A friendly
  // stream error (not an HTTP error) so the chat panel renders it inline and
  // the conversation stays intact; Settings ⚙ is the way out.
  if (onGateway) {
    const fairUse = await getFairUse();
    if (fairUse.tokens >= FREE_TIER_DAILY_TOKEN_LIMIT) {
      const stream = createUIMessageStream<AgentUIMessage>({
        execute({ writer }) {
          writer.write({
            type: "error",
            errorText:
              "Free daily limit reached — add your own key in Settings ⚙ to keep going.",
          });
        },
      });
      return createUIMessageStreamResponse({ stream });
    }
  }

  let messages: AgentUIMessage[];
  try {
    const body = (await req.json()) as { messages?: AgentUIMessage[] };
    if (!Array.isArray(body.messages)) throw new Error("messages missing");
    messages = body.messages;
  } catch {
    return Response.json(
      { error: "Bad request: expected { messages }." },
      { status: 400 },
    );
  }

  const { installationId, repo } = session;

  const stream = createUIMessageStream<AgentUIMessage>({
    // 13 step 5 — the same friendly mapping covers errors thrown inside
    // execute (the merged model stream has its own onError below).
    onError: friendlyProviderError,
    async execute({ writer }) {
      const tools = createWorkspaceTools({
        installationId,
        owner: repo.owner,
        repo: repo.name,
        // 11 step 5 — after a write lands in the repo, tell the client which
        // paths changed. Transient: a signal, never part of the transcript.
        onWrite: (path) => {
          writer.write({
            type: "data-files-changed",
            data: { paths: [path] },
            transient: true,
          });
        },
      });

      const result = streamText({
        model: resolveModel(session),
        system: AGENT_SYSTEM_PROMPT,
        messages: await convertToModelMessages(messages, {
          tools,
          // A stream cut short mid-tool-call must not make the next send fail.
          ignoreIncompleteToolCalls: true,
        }),
        tools,
        stopWhen: isStepCount(AGENT_MAX_STEPS),
        // 13 step 2 — hard output cap on the free tier only; BYOK/OpenRouter
        // spend is the teacher's own.
        ...(onGateway ? { maxOutputTokens: GATEWAY_MAX_OUTPUT_TOKENS } : {}),
      });

      writer.merge(
        toUIMessageStream({
          stream: result.stream,
          tools,
          // 13 step 5 — friendly one-liners; provider error bodies never
          // reach the UI.
          onError: friendlyProviderError,
        }) as ReadableStream<
          InferUIMessageChunk<AgentUIMessage>
        >,
      );

      // 12 step 6 — fair-use metering for the gateway free tier. Cookies
      // can't be set once streaming starts, so the usage travels as a
      // transient `data-usage` part; the panel posts it to /api/settings,
      // which updates the `fu` counter cookie. Only gateway sessions count —
      // BYOK/OpenRouter spend is the user's own.
      if (onGateway) {
        const usage = await result.usage;
        if (usage.totalTokens) {
          writer.write({
            type: "data-usage",
            data: { totalTokens: usage.totalTokens },
            transient: true,
          });
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
