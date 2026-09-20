"use client";

// Decorative, self-contained chat demo for the /resources landing card:
// three slow Q&A exchanges plus the payoff line, looping only while the card
// is on screen (IntersectionObserver gates the single pending timeout).
// Deliberately plain divs + tw-animate-css — ai-elements Message would pull
// Streamdown/shiki/mermaid into a decorative card, and no motion library is
// needed for opacity/slide enters. Reduced-motion users get the full static
// transcript and no timers.

import { ArrowUpIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const SCRIPT = [
  { role: "ai", text: "What age group will you teach?" },
  { role: "user", text: "Ages 6–8" },
  { role: "ai", text: "Have you worked with children before?" },
  { role: "user", text: "Not yet, I'm new to this" },
  { role: "ai", text: "Your background in short?" },
  { role: "user", text: "Biology graduate" },
  { role: "ai", text: "OK, I will create a personalized plan and workspace for you." },
] as const;

// Slow on purpose (reading pace, not demo-video pace), but brisk enough that
// a visitor sees a full exchange in a few seconds.
const TYPING_MS = 1200;
const AI_READ_MS = 2200;
const USER_READ_MS = 1000;
const FINAL_HOLD_MS = 3500;
const FADE_OUT_MS = 600;

type Step = { kind: "typing" | "msg" | "hold" | "fade"; dur: number };

// Flattened timeline: dots before each AI message, a beat after every
// message, a hold on the payoff line, a fade, then back to empty.
const STEPS: Step[] = SCRIPT.flatMap((message): Step[] =>
  message.role === "ai"
    ? [
        { kind: "typing", dur: TYPING_MS },
        { kind: "msg", dur: AI_READ_MS },
      ]
    : [{ kind: "msg", dur: USER_READ_MS }],
).concat({ kind: "hold", dur: FINAL_HOLD_MS }, { kind: "fade", dur: FADE_OUT_MS });

const aiBubble =
  "w-fit max-w-[85%] rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm sm:px-3 sm:py-2";
const userBubble =
  "ml-auto w-fit max-w-[85%] rounded-lg bg-secondary px-2.5 py-1.5 text-sm text-secondary-foreground sm:px-3 sm:py-2";
const enter =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500";

const TypingBubble = () => (
  <div className={cn(aiBubble, "flex items-center gap-1.5")}>
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className="size-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

const ChatDemo = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Run the loop only while on screen: hiding the card clears the pending
  // timeout (freeze), showing it re-arms the current step (resume).
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!visible || reducedMotion) return;
    const id = setTimeout(
      () => setStep((current) => (current + 1) % STEPS.length),
      STEPS[step].dur,
    );
    return () => clearTimeout(id);
  }, [step, visible, reducedMotion]);

  const current = STEPS[step];
  const visibleCount = reducedMotion
    ? SCRIPT.length
    : STEPS.slice(0, step + 1).filter((s) => s.kind === "msg").length;
  const showTyping = !reducedMotion && current.kind === "typing";
  const fading = !reducedMotion && current.kind === "fade";

  return (
    <div
      ref={rootRef}
      className="flex h-[27.5rem] flex-col justify-end overflow-hidden p-4 sm:h-[26rem] sm:p-6"
    >
      <div
        className={cn(
          "flex flex-col gap-1.5 sm:gap-2",
          fading && "opacity-0 transition-opacity duration-500",
        )}
      >
        {SCRIPT.slice(0, visibleCount).map((message, index) => (
          <div
            key={index}
            className={cn(message.role === "ai" ? aiBubble : userBubble, enter)}
          >
            {message.text}
          </div>
        ))}
        {showTyping && <TypingBubble />}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-full border border-border bg-background py-2 pl-4 pr-2 text-sm text-muted-foreground">
        Ask anything…
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ArrowUpIcon className="size-4" />
        </span>
      </div>
    </div>
  );
};

export { ChatDemo };
