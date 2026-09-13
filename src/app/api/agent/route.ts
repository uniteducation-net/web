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
import { resolveModel } from "@/lib/llm";
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
  // "AI on us" via the AI Gateway free tier — fail with a clear error, never
  // crash, when the key is missing.
  // TODO(13-llm-provider): BYOK / OpenRouter sessions won't need this key —
  // the guard moves into resolveModel's gateway branch.
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      {
        error:
          "The assistant is not configured yet: AI_GATEWAY_API_KEY is missing. See docs/plans/icm-workspace-plan/01-setup.md.",
      },
      { status: 503 },
    );
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
      });

      writer.merge(
        toUIMessageStream({ stream: result.stream, tools }) as ReadableStream<
          InferUIMessageChunk<AgentUIMessage>
        >,
      );
    },
  });

  return createUIMessageStreamResponse({ stream });
}
