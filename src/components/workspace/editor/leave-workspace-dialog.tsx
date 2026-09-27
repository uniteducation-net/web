"use client";

// Leaving the workspace (logo click) with unsaved changes: same contract as
// the file-switch guard (unsaved-changes-dialog) — Save primary, the
// destructive path red, both preventDefault so the shell closes the dialog
// only after the save/discard + navigation has resolved.

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

interface LeaveWorkspaceDialogProps {
  open: boolean;
  /** The dirty file the user would be abandoning. */
  path: string;
  saving: boolean;
  onSave(): void;
  onLeave(): void;
  onStay(): void;
}

export function LeaveWorkspaceDialog({
  open,
  path,
  saving,
  onSave,
  onLeave,
  onStay,
}: LeaveWorkspaceDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onStay();
      }}
    >
      <AlertDialogContent className="font-text">
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            Save your changes to{" "}
            <span className="font-mono text-xs">{path}</span> before heading
            back to the website?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Stay</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              onLeave();
            }}
          >
            Leave without saving
          </AlertDialogAction>
          <AlertDialogAction
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              onSave();
            }}
          >
            {saving ? "Saving…" : "Save & leave"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
