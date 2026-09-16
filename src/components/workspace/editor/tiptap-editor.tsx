"use client";

// 15 — the Tiptap instance itself: Notion-style, always editable; markdown is
// just the storage format. Strictly official APIs (tiptap.dev):
// - Markdown extension — `contentType: "markdown"` parses the file in,
//   `editor.getMarkdown()` serializes back out.
// - StarterKit (v3 includes Link + UndoRedo — do NOT register standalone
//   Link, that warns on duplicates).
// - TableKit + TaskList/TaskItem — without them, GFM tables and checklists
//   in the user's files can't parse and would be DROPPED on save (plan C2).
// - Placeholder — CSS-driven hint (rule lives in globals.css).
// `immediatelyRender: false` is required for Next.js per the official guide
// (prevents SSR hydration mismatch).
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import { useEffect } from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import { EditorFloatingMenu } from "./editor-floating-menu";
import { EditorSkeleton } from "./editor-states";

interface TiptapEditorProps {
  /** Raw markdown of the open file. Parsed once at mount — the container
   *  remounts this component per file via `key={path}`. */
  initialMarkdown: string;
  placeholder?: string;
  /** Fires once on create with the NORMALIZED markdown (`getMarkdown()`).
   *  That — never the raw file bytes — is the dirty baseline (plan C1:
   *  markdown → doc → markdown is not byte-stable). */
  onBaseline(markdown: string): void;
  /** Per-transaction normalized markdown for dirty tracking. */
  onUpdate(markdown: string): void;
  /** Hands the live Editor instance up (null on unmount). A callback prop,
   *  not a ref — refs don't cross the next/dynamic boundary reliably. */
  onEditorInit(editor: Editor | null): void;
  className?: string;
}

export function TiptapEditor({
  initialMarkdown,
  placeholder = "Write something …",
  onBaseline,
  onUpdate,
  onEditorInit,
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      TableKit,
      TaskList,
      TaskItem,
      Placeholder.configure({ placeholder }),
    ],
    content: initialMarkdown,
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // The same prose shell the read-only preview used — reading and
        // writing look identical.
        class:
          "prose prose-neutral mx-auto max-w-2xl p-6 font-text outline-none sm:p-8",
      },
    },
    onCreate: ({ editor }) => onBaseline(editor.getMarkdown()),
    onUpdate: ({ editor }) => onUpdate(editor.getMarkdown()),
  });

  useEffect(() => {
    onEditorInit(editor);
    return () => onEditorInit(null);
  }, [editor, onEditorInit]);

  if (!editor) return <EditorSkeleton />;

  return (
    <>
      <ScrollArea className={cn("flex-1", className)}>
        <EditorContent editor={editor} />
      </ScrollArea>
      <EditorBubbleMenu editor={editor} />
      <EditorFloatingMenu editor={editor} />
    </>
  );
}
