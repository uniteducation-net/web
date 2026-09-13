"use client";

import { useRef, useState } from "react";
import { Check, PanelRightClose, RotateCcw, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
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
  mockCannedReply,
  mockMessages,
  mockSuggestions,
  type MockMessage,
} from "../_lib/mock-workspace";

interface AgentPanelProps {
  onCollapse: () => void;
  className?: string;
}

export function AgentPanel({ onCollapse, className }: AgentPanelProps) {
  const [messages, setMessages] = useState<MockMessage[]>(mockMessages);
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(mockMessages.length + 1);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setMessages((prev) => [
      ...prev,
      { id: `u${nextId.current++}`, role: "user", content: trimmed },
    ]);
    setThinking(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `a${nextId.current++}`, role: "assistant", content: mockCannedReply },
      ]);
      setThinking(false);
    }, 900);
  };

  const handleSubmit = (message: PromptInputMessage) => {
    send(message.text);
  };

  const newChat = () => {
    setMessages([]);
    setThinking(false);
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
          {messages.length === 0 && !thinking ? (
            <ConversationEmptyState
              title="Ask me anything"
              description="I can read and edit the files in your workspace — try one of these."
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                {message.activity && (
                  <div className="flex flex-col gap-1">
                    {message.activity.map((step) => (
                      <span
                        key={step.text}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <Check className="size-3 text-primary" />
                        {step.text}
                      </span>
                    ))}
                  </div>
                )}
                <MessageContent
                  className={cn(
                    "font-text",
                    message.role === "user" &&
                      "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
                  )}
                >
                  <div className="prose prose-sm prose-neutral max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </MessageContent>
              </Message>
            ))
          )}
          {thinking && (
            <Message from="assistant">
              <MessageContent>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="size-2 rounded-full bg-primary animate-shadow-ping" />
                  Thinking…
                </span>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t border-border p-3">
        {messages.length === 0 && !thinking && (
          <Suggestions className="mb-2">
            {mockSuggestions.map((suggestion) => (
              <Suggestion
                key={suggestion}
                suggestion={suggestion}
                onClick={send}
              />
            ))}
          </Suggestions>
        )}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Ask about your workspace…" />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={thinking ? "submitted" : undefined}
              aria-label="Send message"
            />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Preview mode — messages aren&apos;t sent anywhere yet.
        </p>
      </div>
    </div>
  );
}
