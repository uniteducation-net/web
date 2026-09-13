"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import {
  Conversation,
  ConversationContent,
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
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import {
  mockFallbackReply,
  mockInterviewReplies,
  openingMessage,
  type OnboardingMessage,
} from "../_lib/mock-onboarding";

const STORAGE_KEY = "onboarding-chat";

interface OnboardingScreenProps {
  /** From the server page (04). Controls the save-button label. */
  authenticated: boolean;
}

export function OnboardingScreen({ authenticated }: OnboardingScreenProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<OnboardingMessage[]>([openingMessage]);
  const [thinking, setThinking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const nextId = useRef(1);

  // Restore the draft conversation after mount (survives the OAuth round-trip).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as OnboardingMessage[];
        if (parsed.length > 0) {
          setMessages(parsed);
          nextId.current = parsed.length;
        }
      }
    } catch {
      // Corrupt or unavailable storage — start fresh.
    }
    setHydrated(true);
  }, []);

  // Persist the draft on every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage full/unavailable — the draft is a convenience, not critical.
    }
  }, [messages, hydrated]);

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  // Preview stand-in for the `data-profile` signal (06 step 4): the mock
  // interview is "complete" once its scripted replies are exhausted.
  const profileComplete = userMessageCount >= mockInterviewReplies.length;

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setMessages((prev) => [
      ...prev,
      { id: `u${nextId.current++}`, role: "user", content: trimmed },
    ]);
    setThinking(true);

    setTimeout(() => {
      setMessages((prev) => {
        const asked = prev.filter((m) => m.role === "user").length;
        const reply =
          mockInterviewReplies[asked - 1] ?? mockFallbackReply;
        return [
          ...prev,
          { id: `a${nextId.current++}`, role: "assistant", content: reply },
        ];
      });
      setThinking(false);
    }, 900);
  };

  const handleSubmit = (message: PromptInputMessage) => {
    send(message.text);
  };

  const saveWorkspace = () => {
    // Preview mode: skip OAuth/provisioning and jump straight to the shell demo.
    router.push("/workspace/demo");
  };

  return (
    <main className="mx-auto flex h-full w-full max-w-2xl flex-col px-4">
      <header className="flex shrink-0 flex-col items-center gap-2 pt-10 pb-4 text-center">
        <Logo className="h-6 w-auto" />
        <p className="text-sm text-muted-foreground">
          Your personal teaching workspace, built in a 2-minute chat.
        </p>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-3">
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent
                className={cn(
                  "font-text",
                  message.role === "user" &&
                    "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
                )}
              >
                {message.content}
              </MessageContent>
            </Message>
          ))}
          {thinking && (
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

      <div className="shrink-0 pt-3 pb-6">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Type your answer…" />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={thinking ? "submitted" : undefined}
              aria-label="Send message"
            />
          </PromptInputFooter>
        </PromptInput>

        <Button
          size="lg"
          className="mt-3 w-full"
          disabled={!profileComplete || thinking}
          onClick={saveWorkspace}
          title={
            profileComplete
              ? undefined
              : "Answer the questions above first"
          }
        >
          <Sparkles className="size-4" />
          {authenticated
            ? "Create my workspace"
            : "Save my workspace — connect GitHub"}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Creates a private repo in YOUR GitHub account. You own everything.
        </p>
      </div>
    </main>
  );
}
