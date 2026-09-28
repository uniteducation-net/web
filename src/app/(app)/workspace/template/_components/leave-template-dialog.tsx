"use client";

// 17 step 6 — leaving the template (logo click) as an anonymous visitor with
// content: the draft is browser-only, so the dialog nudges the login that
// would keep it. Distinct from LeaveWorkspaceDialog (that one guards an
// unsaved editor buffer; this one guards the whole local draft).

import Link from "next/link";
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

interface LeaveTemplateDialogProps {
  open: boolean;
  onStay(): void;
}

const LOGIN_HREF = "/api/auth/github?next=/workspace/template";

export function LeaveTemplateDialog({ open, onStay }: LeaveTemplateDialogProps) {
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
          {/* Plain <a>: an API route that 302s to GitHub wants a full-document
              navigation (same convention as the onboarding login link). */}
          <AlertDialogAction asChild>
            <a href={LOGIN_HREF}>Log in to save</a>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
