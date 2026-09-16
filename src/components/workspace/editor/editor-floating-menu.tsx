"use client";

// 15 — Notion-style empty-line menu: block starters shown when the cursor
// sits in an empty paragraph (FloatingMenu from @tiptap/react/menus —
// official docs; custom shouldShow narrows it to truly empty paragraphs).
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import type { Editor } from "@tiptap/core";
import { FloatingMenu } from "@tiptap/react/menus";
import { Heading1, Heading2, List, ListOrdered, TextQuote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorFloatingMenuProps {
  editor: Editor;
}

export function EditorFloatingMenu({ editor }: EditorFloatingMenuProps) {
  return (
    <FloatingMenu
      editor={editor}
      shouldShow={({ state }) => {
        const { $from, empty } = state.selection;
        return (
          empty &&
          $from.parent.type.name === "paragraph" &&
          $from.parent.content.size === 0
        );
      }}
      className="flex items-center gap-0.5 rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10"
    >
      <MenuButton
        label="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="size-3.5" />
      </MenuButton>
      <MenuButton
        label="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-3.5" />
      </MenuButton>
      <MenuButton
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" />
      </MenuButton>
      <MenuButton
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" />
      </MenuButton>
      <MenuButton
        label="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <TextQuote className="size-3.5" />
      </MenuButton>
    </FloatingMenu>
  );
}

function MenuButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick(): void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
