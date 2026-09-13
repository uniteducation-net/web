"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
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
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import {
  OPENING_MESSAGE,
  type OnboardingProfile,
  type OnboardingUIMessage,
} from "../_lib/onboarding-chat";

const STORAGE_KEY = "onboarding-chat";

interface OnboardingScreenProps {
  /** From the server page (04). Controls the save-button label. */
  authenticated: boolean;
}

function readDraft(): OnboardingUIMessage[] | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as OnboardingUIMessage[];
    // Light shape check — ignore drafts from older (mock) formats.
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (!parsed.every((m) => Array.isArray(m?.parts))) return null;
    return parsed;
  } catch {
    // Corrupt or unavailable storage — start fresh.
    return null;
  }
}

export function OnboardingScreen({ authenticated }: OnboardingScreenProps) {
  const router = useRouter();
  const transport = useMemo(
    () => new DefaultChatTransport<OnboardingUIMessage>({ api: "/api/chat" }),
    [],
  );
  const { messages, setMessages, sendMessage, status, error } =
    useChat<OnboardingUIMessage>({
      transport,
      messages: [OPENING_MESSAGE],
    });
  const [hydrated, setHydrated] = useState(false);

  const busy = status === "submitted" || status === "streaming";

  // Restore the draft conversation after mount (survives the OAuth round-trip).
  useEffect(() => {
    const draft = readDraft();
    if (draft) setMessages(draft);
    setHydrated(true);
  }, [setMessages]);

  // Persist the draft on every change (05 step 3). Draft buffer only — the
  // durable copy lives in the repo via "Save this chat" (11).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage full/unavailable — the draft is a convenience, not critical.
    }
  }, [messages, hydrated]);

  // Readiness signal (05 step 5): the chat API appends a `data-profile` part
  // when the interviewer is done (06 step 4). Latest one wins.
  const profileSignal = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const part = messages[i].parts.find((p) => p.type === "data-profile");
      if (part?.type === "data-profile") return part.data;
    }
    return null;
  }, [messages]);
  const profileComplete = profileSignal?.complete === true;
  const profile: OnboardingProfile | null = profileComplete
    ? profileSignal.profile
    : null;

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || busy) return;
    sendMessage({ text });
  };

  const saveWorkspace = () => {
    if (!authenticated) {
      // Mid-onboarding OAuth (04 step 4): hard-nav into the GitHub App flow
      // and come straight back here. The draft conversation survives in
      // localStorage and is restored on return.
      window.location.href = "/api/auth/github?next=/workspace/start";
      return;
    }
    // TODO(07): POST /api/workspace/create with the extracted `profile`, then
    // hard-nav to /workspace (the guard finds the repo and renders the shell).
    // Preview stand-in until provisioning is wired.
    void profile;
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
          ))}
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

      <div className="shrink-0 pt-3 pb-6">
        {status === "error" && (
          <p className="pb-2 text-center text-xs text-destructive">
            {error?.message ||
              "Something went wrong — please try sending that again."}
          </p>
        )}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Type your answer…" />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} aria-label="Send message" />
          </PromptInputFooter>
        </PromptInput>

        <Button
          size="lg"
          className="mt-3 w-full"
          disabled={!profileComplete || busy}
          onClick={saveWorkspace}
          title={profileComplete ? undefined : "Answer the questions above first"}
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
