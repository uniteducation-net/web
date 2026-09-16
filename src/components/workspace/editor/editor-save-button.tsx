"use client";

// 15 — primary Save with icon. Rendered by the header ONLY while dirty
// (user spec: no changes → no button). Each save is one git commit in the
// user's repo via PUT /api/workspace/file.
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorSaveButtonProps {
  saving: boolean;
  onClick(): void;
}

export function EditorSaveButton({ saving, onClick }: EditorSaveButtonProps) {
  return (
    <Button variant="default" size="sm" onClick={onClick} disabled={saving}>
      <Save className="size-3.5" />
      {saving ? "Saving…" : "Save"}
    </Button>
  );
}
