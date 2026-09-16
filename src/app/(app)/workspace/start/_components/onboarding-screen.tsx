"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LogIn } from "lucide-react";
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

/** Sent when the teacher skips (or cuts short) the interview: every field is
    nullable per teacherProfileSchema, and provisioning fills the gaps. */
const EMPTY_PROFILE: OnboardingProfile = {
  name: null,
  subject: null,
  gradeLevel: null,
  teachingContext: null,
  tone: null,
  goals: null,
};

/** Centered → bottom glide: animates the flex-grow regions around the chat. */
const layoutMotion =
  "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-in-out";

/** Full-document nav into the GitHub OAuth chain; the draft chat survives in
    localStorage and is restored on return to `next`. */
const GITHUB_LOGIN_HREF = "/api/auth/github?next=/workspace/start";

interface OnboardingScreenProps {
  /** From the server page (04). Decides whether "Go to workspace" starts the
      GitHub OAuth flow or provisions the repo directly. */
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
  const transport = useMemo(
    () => new DefaultChatTransport<OnboardingUIMessage>({ api: "/api/chat" }),
    [],
  );
  const { messages, setMessages, sendMessage, status, error } =
    useChat<OnboardingUIMessage>({
      transport,
      messages: [OPENING_MESSAGE],
    });
  // Restore gate: a ref, not state — it only sequences the two effects below
  // (persist must not run before restore), so it never needs a re-render.
  const restoredRef = useRef(false);
  // Provisioning state (07): the create call runs template generation +
  // personalization, so it can take several seconds.
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const busy = status === "submitted" || status === "streaming";
  // Centered until the teacher sends their first message, then the input
  // glides to the bottom (the seeded opening message doesn't count).
  const started = messages.some((m) => m.role === "user");

  // Restore the draft conversation after mount (survives the OAuth round-trip).
  // Declared before the persist effect so it runs first on mount.
  useEffect(() => {
    const draft = readDraft();
    if (draft) setMessages(draft);
    restoredRef.current = true;
  }, [setMessages]);

  // Persist the draft on every change (05 step 3). Draft buffer only — the
  // durable copy lives in the repo via "Save this chat" (11).
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage full/unavailable — the draft is a convenience, not critical.
    }
  }, [messages]);

  // Readiness signal (05 step 5): the chat API appends a `data-profile` part
  // when the interviewer is done (06 step 4). Latest one wins.
  const profileSignal = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const part = messages[i].parts.find((p) => p.type === "data-profile");
      if (part?.type === "data-profile") return part.data;
    }
    return null;
  }, [messages]);
  const profile: OnboardingProfile | null =
    profileSignal?.complete === true ? profileSignal.profile : null;

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || busy) return;
    sendMessage({ text });
  };

  const goToWorkspace = async () => {
    if (!authenticated) {
      // Mid-onboarding OAuth (04 step 4): hard-nav into the GitHub App flow
      // and come straight back here. The draft conversation survives in
      // localStorage and is restored on return. Must be a full document
      // navigation — this is an API route that 302s to GitHub, not a page.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = GITHUB_LOGIN_HREF;
      return;
    }
    if (creating) return;

    // Provision (07): create + personalize the teacher's repo, then hard-nav
    // to /workspace — the guard (04) finds the repo and renders the shell.
    // Without a finished interview the workspace is seeded from EMPTY_PROFILE.
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profile ?? EMPTY_PROFILE }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        fixUrl?: string;
      };

      if (res.status === 409 && data.fixUrl) {
        // The app installation doesn't cover the new repo yet — GitHub's
        // page grants access in one click, then the teacher retries (the
        // create call is idempotent).
        window.location.href = data.fixUrl;
        return;
      }
      if (!res.ok) {
        setCreateError(
          data.message ??
            (data.error === "github_unavailable"
              ? "GitHub is having trouble right now — please try again in a moment."
              : data.error === "app_not_installed"
                ? "GitHub isn't fully connected yet — press the button again to reconnect."
                : "Something went wrong while creating your workspace — please try again."),
        );
        return;
      }

      // Full reload is deliberate: the teacher was redirected away from
      // /workspace moments ago, so its payload sits in the client router
      // cache and router.push could serve the stale pre-provision state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/workspace";
    } catch {
      setCreateError(
        "Couldn't reach the server — check your connection and try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="mx-auto flex h-full w-full max-w-2xl flex-col px-4">
      <div className="flex shrink-0 items-center justify-between pt-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/en">
            <ArrowLeft className="size-4" />
            Website
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={goToWorkspace}
          disabled={busy || creating}
        >
          {creating ? "Creating your workspace…" : "Go to workspace"}
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <header className="flex shrink-0 flex-col items-center gap-2 pt-8 pb-4 text-center">
        <Logo className="[&_.logo-text]:text-2xl" />
        <p className="text-sm text-muted-foreground">
          Your personal teaching workspace, built in a 2-minute chat.
        </p>
      </header>

      {/* Centered → bottom glide: before the first user message both spacers
          grow, centering the chat block; afterwards they collapse and the
          conversation grows to fill, docking the input at the bottom.
          flex-grow animates, so the input glides; motion-safe keeps it
          instant for reduced-motion users. */}
      <div
        aria-hidden
        className={cn(layoutMotion, started ? "grow-0" : "grow")}
      />
      <div
        className={cn(
          layoutMotion,
          "flex min-h-0 flex-col",
          started ? "grow" : "grow-0",
        )}
      >
        <Conversation>
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
      </div>

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

        {createError && (
          <p className="pt-2 text-center text-xs text-destructive">
            {createError}
          </p>
        )}
        {!authenticated && (
          <div className="mt-2 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground"
            >
              {/* Plain <a>, not Link: an API route that 302s to GitHub wants a
                  full-document navigation. */}
              <a href={GITHUB_LOGIN_HREF}>
                <LogIn className="size-4" />
                Optional: Log in to save progress
              </a>
            </Button>
          </div>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link
            href="/en/terms/terms"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          {" · "}
          <Link
            href="/en/terms/privacy"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
        </p>
      </div>

      <div
        aria-hidden
        className={cn(layoutMotion, started ? "grow-0" : "grow")}
      />
    </main>
  );
}
