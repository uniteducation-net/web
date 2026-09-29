"use client";

// 17 step 6 — leaving the template (logo click) as an anonymous visitor with
// content: the draft is browser-only, so the dialog nudges the login that
// would keep it. Distinct from LeaveWorkspaceDialog (that one guards an
// unsaved editor buffer; this one guards the whole local draft).
// The login runs in the small popup window (lib/auth-popup.ts) and chains
// straight into the create conversion — the page never navigates.

import Link from "next/link";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { GitHubConnectButton } from "@/components/github-connect-button";

interface LeaveTemplateDialogProps {
  open: boolean;
  onStay(): void;
  /** After a successful connect: the shell converts the draft immediately. */
  onConnectAndCreate?(): void;
}

export function LeaveTemplateDialog({
  open,
  onStay,
  onConnectAndCreate,
}: LeaveTemplateDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onStay();
      }}
    >
      <AlertDialogContent className="font-text">
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this template?</AlertDialogTitle>
          <AlertDialogDescription>
            Your draft is saved only in this browser. Log in first to keep it
            as your own workspace.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <Link
            href="/en"
            className={buttonVariants({ variant: "ghost" })}
          >
            Leave anyway
          </Link>
          {/* Deliberately NOT AlertDialogAction asChild: Radix Slot-cloning a
              composite is fragile, and the dialog must stay open while the
              popup is pending (the button shows "Waiting for GitHub…"). */}
          <GitHubConnectButton
            next="/workspace/template"
            variant="default"
            onConnected={() => {
              onStay();
              onConnectAndCreate?.();
            }}
          >
            Log in to save
          </GitHubConnectButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

