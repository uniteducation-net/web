"use client";

// Full-screen staged progress for the workspace-creation chain (07/17): the
// connect → create → seed → open sequence can take up to a minute, and a
// disabled button alone reads as "frozen" to a non-technical teacher.
// Rendered by both create callers (onboarding goToWorkspace, template
// createWorkspace) while their `creating` state is set.

import { Logo } from "@/components/logo";
import { createStageCopy, type CreateStage } from "@/lib/create-progress-copy";

export function CreateProgress({ stage }: { stage: CreateStage }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 px-6 text-center backdrop-blur-sm"
    >
      <Logo />
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      <p className="text-sm font-medium">{createStageCopy(stage)}</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        The first time can take up to a minute — your workspace is being
        created privately on your own GitHub.
      </p>
    </div>
  );
}
