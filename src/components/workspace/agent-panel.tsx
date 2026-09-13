"use client";

// 08/11 — right column: the workspace assistant. Chat wiring (useChat →
// /api/agent) follows the same AI SDK 7 pattern as onboarding (05); the
// server route is a 501 stub until 11 adds repo read/write tools, so sends
// surface a friendly error. Onboarding continuity (08 step 6): the shell
// hands the previous conversation in as `initialMessages`.
// Plan: docs/plans/icm-workspace-plan/11-agent-panel.md

import { useMemo } from "react";
import { PanelRightClose, RotateCcw, Save } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgentPanelProps {
  /** Onboarding conversation carried over on first visit (08 step 6). */
  initialMessages?: UIMessage[];
  onCollapse: () => void;
  /** 09 step 3: call after repo writes so the sidebar tree re-fetches.
   *  TODO(11-agent-panel): invoke when repo read/write tools commit. */
  onFilesChanged?: () => void;
  className?: string;
}

export function AgentPanel({
  initialMessages,
  onCollapse,
  className,
}: AgentPanelProps) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/agent" }),
    [],
  );
  const { messages, setMessages, sendMessage, status, error } =
    useChat({
      transport,
      messages: initialMessages,
    });

  const busy = status === "submitted" || status === "streaming";

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || busy) return;
    sendMessage({ text });
  };

  const newChat = () => {
    setMessages([]);
  };

  return (
    <div
      className={cn(
        "flex h-full w-[380px] flex-col border-l border-border bg-background",
        className,
      )}
    >
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <h2 className="font-heading text-sm font-semibold text-secondary">
          Assistant
        </h2>
        <div className="flex items-center gap-0.5">
          {/* TODO(11-agent-panel): POST /api/workspace/save-chat → chats/ */}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Save this chat"
            title="Save this chat (coming soon)"
            disabled
          >
            <Save className="size-4" />
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
              description="I can read and edit the files in your workspace."
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
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      message.role === "assistant" ? (
                        <MessageResponse key={index}>
                          {part.text}
                        </MessageResponse>
                      ) : (
                        <span key={index}>{part.text}</span>
                      )
                    ) : null,
                  )}
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
        {status === "error" && (
          <p className="pb-2 text-center text-xs text-destructive">
            {error?.message?.includes("501")
              ? "The assistant isn't wired up yet — it comes online in the next step."
              : error?.message ||
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
    </div>
  );
}
