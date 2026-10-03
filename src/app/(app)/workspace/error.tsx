"use client";

// Segment error boundary for the whole workspace (page, start, template,
// auth-complete): any render failure lands here instead of Next's raw
// production error page. Non-technical teachers get a way forward; the
// technical detail stays in the console/Vercel logs.

import { useEffect } from "react";
import { WorkspaceUnavailable } from "@/components/workspace/workspace-unavailable";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("workspace render failed:", error);
  }, [error]);
  return <WorkspaceUnavailable reset={reset} />;
}
