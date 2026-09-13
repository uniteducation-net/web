"use client";

// 11 — right column: the workspace assistant, now with hands. Chat via
// useChat → /api/agent (repo read/write tools, same AI SDK 7 pattern as
// onboarding 05/06). After the agent writes files the server emits a
// transient `data-files-changed` part → we call onFilesChanged so the tree
// (09) and preview (10) refresh. "Save this chat" persists the conversation
// to chats/ in the teacher's repo (/api/workspace/save-chat).
// Onboarding continuity (08 step 6): the shell hands the previous
// conversation in as `initialMessages`.
// Plan: docs/plans/icm-workspace-plan/11-agent-panel.md

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleAlert,
  PanelRightClose,
  RotateCcw,
  Save,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Suggestion,
  Suggestions,
} from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AGENT_SUGGESTIONS,
  type AgentUIMessage,
  type AgentUITools,
} from "./agent-chat";

interface AgentPanelProps {
  /** Onboarding conversation carried over on first visit (08 step 6). */
  initialMessages?: UIMessage[];
  onCollapse: () => void;
  /** 09 step 3 / 11 step 5: called after the agent writes files (and after a
   *  chat is saved) so the sidebar tree and the preview re-fetch. */
  onFilesChanged?: () => void;
  className?: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "failed";

/**
 * Subtle inline tool-activity rows (11 step 8) — teachers see the agent
 * working ("Reading 02-script/CONTEXT.md…", "Updated voice-rules.md ✓"),
 * never raw JSON or base64.
 */
function ToolActivityRow({ part }: { part: ToolUIPart<AgentUITools> }) {
  // During input-streaming the input is still partial — read paths defensively.
  const input = part.input as { path?: string } | undefined;
  const path = input?.path;
  const done = part.state === "output-available";
  const failed = part.state === "output-error" || part.state === "output-denied";

  let working: string;
  let finished: string;
  switch (part.type) {
    case "tool-listFiles":
      working = "Looking at your workspace files…";
      finished = "Looked at your workspace files";
      break;
    case "tool-readFile":
      working = `Reading ${path ?? "a file"}…`;
      finished = `Read ${path ?? "file"}`;
      break;
    case "tool-writeFile": {
      const created =
        done && part.output?.created === true;
      working = `Writing ${path ?? "a file"}…`;
      finished = `${created ? "Created" : "Updated"} ${path ?? "file"}`;
      break;
    }
    default:
      return null;
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {failed ? (
        <CircleAlert className="size-3 shrink-0 text-destructive" />
      ) : done ? (
        <Check className="size-3 shrink-0 text-primary" />
      ) : (
        <Loader size={12} className="shrink-0" />
      )}
      <span className="truncate">
        {failed ? `Couldn't finish: ${working.replace(/…$/, "")}` : done ? finished : working}
      </span>
    </span>
  );
}

export function AgentPanel({
  initialMessages,
  onCollapse,
  onFilesChanged,
  className,
}: AgentPanelProps) {
  const transport = useMemo(
    () => new DefaultChatTransport<AgentUIMessage>({ api: "/api/agent" }),
    [],
  );
  // The chat callbacks capture their initial closure — keep the latest
  // onFilesChanged behind a ref so a re-render never goes stale.
  const onFilesChangedRef = useRef(onFilesChanged);
  useEffect(() => {
    onFilesChangedRef.current = onFilesChanged;
  }, [onFilesChanged]);

  const { messages, setMessages, sendMessage, status, error } =
    useChat<AgentUIMessage>({
      transport,
      messages: initialMessages as AgentUIMessage[] | undefined,
      onData: (part) => {
        // 11 step 5 — the agent wrote to the repo: refresh tree + preview.
        if (part.type === "data-files-changed") onFilesChangedRef.current?.();
      },
    });

  const busy = status === "submitted" || status === "streaming";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Auto-dismiss the save toast.
  useEffect(() => {
    if (saveStatus !== "saved" && saveStatus !== "failed") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 5000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || busy) return;
    sendMessage({ text });
  };

  const newChat = () => {
    setMessages([]);
    setSaveStatus("idle");
  };

  /** 11 step 6 — persist the conversation to chats/ in the teacher's repo. */
  const saveChat = async () => {
    if (messages.length === 0 || busy || saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/workspace/save-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error(`save-chat failed: ${res.status}`);
      setSaveStatus("saved");
      // The new transcript file should appear in the tree (09) right away.
      onFilesChangedRef.current?.();
    } catch {
      setSaveStatus("failed");
    }
  };

  return (
    <div
      className={cn(
        "relative flex h-full w-[380px] flex-col border-l border-border bg-background",
        className,
      )}
    >
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <h2 className="font-heading text-sm font-semibold text-secondary">
          Assistant
        </h2>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Save this chat"
            title="Save this chat to your workspace (chats/)"
            onClick={saveChat}
            disabled={messages.length === 0 || busy || saveStatus === "saving"}
          >
            {saveStatus === "saving" ? (
              <Loader size={16} />
            ) : (
              <Save className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="New chat"
            title="New chat"
            onClick={newChat}
            disabled={busy}
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse assistant (Ctrl+J)"
            title="Collapse assistant (Ctrl+J)"
            onClick={onCollapse}
          >
            <PanelRightClose className="size-4" />
          </Button>
        </div>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-3">
          {messages.length === 0 && !busy ? (
            <ConversationEmptyState
              title="Ask me anything"
              description="I can read and edit the files in your workspace — try one of these."
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent
                  className={cn(
                    "font-text",
                    message.role === "user" &&
                      "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
                  )}
                >
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return message.role === "assistant" ? (
                        <MessageResponse key={index}>
                          {part.text}
                        </MessageResponse>
                      ) : (
                        <span key={index}>{part.text}</span>
                      );
                    }
                    if (part.type.startsWith("tool-")) {
                      return (
                        <ToolActivityRow
                          key={index}
                          part={part as ToolUIPart<AgentUITools>}
                        />
                      );
                    }
                    // step-start, data, reasoning… — nothing to show.
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="size-2 animate-shadow-ping rounded-full bg-primary" />
                  Thinking…
                </span>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t border-border p-3">
        {messages.length === 0 && !busy && (
          // 11 step 9 — suggestions teach the mental model better than any
          // onboarding doc.
          <Suggestions className="mb-2">
            {AGENT_SUGGESTIONS.map((suggestion) => (
              <Suggestion
                key={suggestion}
                suggestion={suggestion}
                onClick={(text) => sendMessage({ text })}
              />
            ))}
          </Suggestions>
        )}
        {status === "error" && (
          <p className="pb-2 text-center text-xs text-destructive">
            {error?.message ||
              "Something went wrong — please try sending that again."}
          </p>
        )}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Ask about your workspace…" />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} aria-label="Send message" />
          </PromptInputFooter>
        </PromptInput>
      </div>

      {/* Save-chat toast — same subtle, self-dismissing pattern as the
          preview's "Updated just now" (10 step 5). */}
      {(saveStatus === "saved" || saveStatus === "failed") && (
        <div
          role="status"
          className="absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs whitespace-nowrap text-secondary shadow-sm"
        >
          {saveStatus === "saved" ? (
            <>
              <Check className="size-3.5 text-primary" />
              Chat saved to chats/ ✓
            </>
          ) : (
            <>
              <CircleAlert className="size-3.5 text-destructive" />
              Couldn&apos;t save the chat — try again.
            </>
          )}
        </div>
      )}
    </div>
  );
}
