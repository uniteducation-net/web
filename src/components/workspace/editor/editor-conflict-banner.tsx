"use client";

// 15 — conflict notice: the file moved under the editor. Two triggers share
// this banner — a save that 409s (sha_mismatch), and the assistant writing
// the open file while it's dirty (external). "Reload latest" discards the
// local edits; "Save anyway" re-reads the remote sha and overwrites their
// change. Copy says which side each button keeps.
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorConflictBannerProps {
  reason: "sha_mismatch" | "external";
  busy: boolean;
  onReloadLatest(): void;
  onSaveAnyway(): void;
}

const COPY = {
  sha_mismatch: "This file changed on GitHub since you opened it.",
  external: "The assistant changed this file while you were editing.",
} as const;

export function EditorConflictBanner({
  reason,
  busy,
  onReloadLatest,
  onSaveAnyway,
}: EditorConflictBannerProps) {
  return (
    <div
      role="alert"
      className="absolute bottom-4 left-1/2 z-10 flex w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-md"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-secondary">
        <TriangleAlert className="size-3.5 text-muted-foreground" />
        {COPY[reason]}
      </p>
      <p className="text-xs text-muted-foreground">
        Reload to see their version (your edits are lost), or save anyway to
        keep yours.
      </p>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReloadLatest}
          disabled={busy}
        >
          Reload latest
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onSaveAnyway}
          disabled={busy}
        >
          Save anyway
        </Button>
      </div>
    </div>
  );
}
