"use client";

// 15 — file-switch guard: the shell holds the navigation target
// (pendingPath) while this dialog asks what to do with unsaved changes.
// Save is primary, Discard red (user spec). Both actions preventDefault so
// the dialog doesn't auto-close mid-action — the shell closes it (open=false)
// once the save/discard + navigation has resolved.
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

interface UnsavedChangesDialogProps {
  open: boolean;
  /** The file the user is trying to switch to. */
  targetPath: string | null;
  saving: boolean;
  onSave(): void;
  onDiscard(): void;
  onCancel(): void;
}

export function UnsavedChangesDialog({
  open,
  targetPath,
  saving,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent className="font-text">
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            Save or discard your changes before opening{" "}
            <span className="font-mono text-xs">{targetPath}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              onDiscard();
            }}
          >
            Discard
          </AlertDialogAction>
          <AlertDialogAction
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              onSave();
            }}
          >
            {saving ? "Saving…" : "Save"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
