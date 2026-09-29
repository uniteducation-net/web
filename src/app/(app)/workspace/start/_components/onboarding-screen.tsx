"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, LogOut, X } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import type { SessionUser } from "@/lib/session";
import {
  ONBOARDING_DRAFT_KEY,
  draftProfile,
  readOnboardingDraft,
} from "@/lib/onboarding-draft";
import { describeCreateError, type CreateErrorCopy } from "@/lib/create-error";
import {
  authStartUrl,
  connectGitHub,
  openPopup,
} from "@/lib/auth-popup";
import { GitHubConnectButton } from "@/components/github-connect-button";
import { cn } from "@/lib/utils";
import {
  OPENING_MESSAGE,
  type OnboardingProfile,
  type OnboardingUIMessage,
} from "../_lib/onboarding-chat";

/** Sent when the teacher skips (or cuts short) the interview: every field is
    nullable per teacherProfileSchema, and provisioning fills the gaps. */
const EMPTY_PROFILE: OnboardingProfile = {
  name: null,
  ageGroup: null,
  workedWithChildren: null,
  background: null,
  teachingWhatWhere: null,
  schedule: null,
};

/** Centered → bottom glide: animates the flex-grow regions around the chat. */
const layoutMotion =
  "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-in-out";

interface OnboardingScreenProps {
  /** From the server page (04). Decides whether "Go to workspace" opens the
      local template (logged out) or provisions the repo (logged in). */
  authenticated: boolean;
  /** Present when authenticated — shown in place of the login button so the
      teacher can see which GitHub account they're pairing. */
  user?: SessionUser;
}

export function OnboardingScreen({ authenticated, user }: OnboardingScreenProps) {
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
  // Restore gate: a ref, not state — it only sequences the two effects below
  // (persist must not run before restore), so it never needs a re-render.
  const restoredRef = useRef(false);
  // Provisioning state (07): the create call runs template generation +
  // personalization, so it can take several seconds.
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<CreateErrorCopy | null>(null);
  // Popup connect flow (lib/auth-popup.ts): status line shown while the
  // small GitHub window is open, plus the gentle "nothing changed" note.
  const [connectNote, setConnectNote] = useState<string | null>(null);
  // Inline two-step logout confirm — the icon swaps to "Sure? ✓ ✗" in place.
  const [confirmLogout, setConfirmLogout] = useState(false);

  const busy = status === "submitted" || status === "streaming";
  // Centered until the teacher sends their first message, then the input
  // glides to the bottom (the seeded opening message doesn't count).
  const started = messages.some((m) => m.role === "user");

  // Restore the draft conversation after mount (survives the OAuth round-trip).
  // Declared before the persist effect so it runs first on mount.
  useEffect(() => {
    const draft = readOnboardingDraft();
    if (draft) setMessages(draft);
    restoredRef.current = true;
  }, [setMessages]);

  // Persist the draft on every change (05 step 3). Draft buffer only — the
  // durable copy lives in the repo via "Save this chat" (11).
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(messages));
    } catch {
      // Storage full/unavailable — the draft is a convenience, not critical.
    }
  }, [messages]);

  // Readiness signal (05 step 5): the chat API appends a `data-profile` part
  // when the interviewer is done (06 step 4). Latest one wins.
  const profile: OnboardingProfile | null = useMemo(
    () => draftProfile(messages),
    [messages],
  );

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || busy) return;
    sendMessage({ text });
  };

  // Same contract as settings-modal logout: drop the session cookie, wipe
  // local drafts, reload so the page re-renders unauthenticated.
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // offline — clear locally anyway
    }
    try {
      localStorage.clear();
    } catch {
      // storage unavailable — nothing to clear
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/workspace/start";
  };

  const goToWorkspace = async () => {
    if (!authenticated) {
      // Anonymous visitors get the local template workspace (17) — no OAuth
      // wall. The draft chat survives in localStorage: the template reads
      // the profile from it and pre-fills what it can.
      router.push("/workspace/template");
      return;
    }
    if (creating) return;

    // Provision (07): create + personalize the teacher's repo, then hard-nav
    // to /workspace — the guard (04) finds the repo and renders the shell.
    // Without a finished interview the workspace is seeded from EMPTY_PROFILE.
    // Two attempts max: a recoverable auth/coverage failure opens the small
    // GitHub window (lib/auth-popup.ts) and retries ONCE — the main page
    // never navigates away.
    setCreating(true);
    setCreateError(null);
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
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

        if (res.ok) {
          // Full reload is deliberate: the teacher was redirected away from
          // /workspace moments ago, so its payload sits in the client router
          // cache and router.push could serve the stale pre-provision state.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/workspace";
          return;
        }

        // The app installation doesn't cover the new repo yet — grant access
        // in the small window (github.com can't message us; closing it fires
        // the retry), then the server's coverage check decides.
        if (res.status === 409 && data.fixUrl && attempt === 0) {
          setConnectNote(
            "Grant access in the small window, then close it — we'll take it from there.",
          );
          await openPopup(data.fixUrl);
          setConnectNote(null);
          continue;
        }

        // Stale/expired session or a pre-permission-grant token (99 #11):
        // reconnect in the small window and retry once.
        if (
          attempt === 0 &&
          (res.status === 401 ||
            (res.status === 403 &&
              data.error === "github_reauthorization_needed") ||
            (res.status === 409 && data.error === "app_not_installed"))
        ) {
          setConnectNote(
            "Finish the one GitHub step in the small window — it closes by itself.",
          );
          const result = await connectGitHub();
          setConnectNote(null);
          if (result.outcome === "blocked") {
            // Popup refused → the old full-page chain (draft survives).
            window.location.assign(authStartUrl("/workspace/start"));
            return;
          }
          if (result.outcome === "connected") continue;
          setCreateError({
            message:
              "Nothing changed — log in from the small window when you're ready, then press the button again.",
          });
          return;
        }

        setCreateError(describeCreateError(data));
        return;
      }
    } catch {
      setCreateError({
        message: "Couldn't reach the server — check your connection and try again.",
      });
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

        {connectNote && (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            {connectNote}
          </p>
        )}
        {createError && (
          <div className="pt-2 text-center text-xs">
            <p className="text-destructive">{createError.message}</p>
            <div className="mt-1 flex items-center justify-center gap-3">
              {createError.reconnect && (
                <GitHubConnectButton
                  inline
                  next="/workspace/start"
                  onConnected={() => {
                    setCreateError(null);
                    void goToWorkspace();
                  }}
                >
                  Reconnect GitHub
                </GitHubConnectButton>
              )}
              {/* Escape hatch on every create failure (17): the local
                  template works without login and keeps the chat profile. */}
              <Link
                href="/workspace/template"
                className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              >
                Open a local template instead
              </Link>
            </div>
          </div>
        )}
        {authenticated && user ? (
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Avatar className="size-5">
              <AvatarImage src={user.avatarUrl} alt={user.name ?? user.login} />
              <AvatarFallback className="bg-secondary text-[9px] text-secondary-foreground">
                {(user.name ?? user.login).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>
              Logged in as{" "}
              <span className="font-medium text-foreground">
                @{user.login}
              </span>
            </span>
            {confirmLogout ? (
              <span className="flex items-center gap-0.5">
                <span className="text-xs">Sure?</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Confirm log out"
                  className="text-destructive hover:text-destructive"
                  onClick={() => void logout()}
                >
                  <Check />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Cancel log out"
                  className="text-muted-foreground"
                  onClick={() => setConfirmLogout(false)}
                >
                  <X />
                </Button>
              </span>
            ) : (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Log out"
                className="text-muted-foreground"
                onClick={() => setConfirmLogout(true)}
              >
                <LogOut />
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-2 flex flex-col items-center justify-center">
            <GitHubConnectButton
              next="/workspace/start"
              showHelper
              onConnected={() => router.refresh()}
              onAborted={() =>
                setConnectNote("Nothing changed — try again when you're ready.")
              }
              className="text-muted-foreground"
            >
              Optional: Log in to save progress
            </GitHubConnectButton>
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
