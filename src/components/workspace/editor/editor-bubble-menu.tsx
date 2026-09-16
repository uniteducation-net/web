"use client";

// 15 — Notion-style selection menu: floats over highlighted text. The React
// BubbleMenu component ships with @tiptap/react (`@tiptap/react/menus`) — no
// extension registration needed (official docs). Active states go through
// useEditorState, the v3 reactivity idiom (plain `editor.isActive()` in
// render would never re-render). Link editing is a two-state row ⇄ inline
// URL input.
// Plan: docs/plans/icm-workspace-plan/15-markdown-editor.md

import { useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  TextQuote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditorBubbleMenuProps {
  editor: Editor;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");

  const active = useEditorState({
    editor,
    selector: (snapshot) => ({
      bold: snapshot.editor.isActive("bold"),
      italic: snapshot.editor.isActive("italic"),
      strike: snapshot.editor.isActive("strike"),
      h1: snapshot.editor.isActive("heading", { level: 1 }),
      h2: snapshot.editor.isActive("heading", { level: 2 }),
      bulletList: snapshot.editor.isActive("bulletList"),
      orderedList: snapshot.editor.isActive("orderedList"),
      blockquote: snapshot.editor.isActive("blockquote"),
      link: snapshot.editor.isActive("link"),
    }),
  });

  const openLinkEditor = () => {
    setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkOpen(true);
  };

  const applyLink = () => {
    const href = url.trim();
    if (href) {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkOpen(false);
    setUrl("");
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setLinkOpen(false);
    setUrl("");
  };

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10"
    >
      {linkOpen ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setLinkOpen(false);
              }
            }}
            placeholder="https://…"
            className="h-7 w-48 text-xs"
            aria-label="Link URL"
          />
          <Button type="button" variant="ghost" size="sm" onClick={applyLink}>
            Apply
          </Button>
          {active.link && (
            <Button type="button" variant="ghost" size="sm" onClick={removeLink}>
              Remove
            </Button>
          )}
        </div>
      ) : (
        <>
          <MenuButton
            label="Bold"
            active={active.bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-3.5" />
          </MenuButton>
          <MenuButton
            label="Italic"
            active={active.italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-3.5" />
          </MenuButton>
          <MenuButton
            label="Strikethrough"
            active={active.strike}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-3.5" />
          </MenuButton>
          <MenuButton
            label="Heading 1"
            active={active.h1}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="size-3.5" />
          </MenuButton>
          <MenuButton
            label="Heading 2"
            active={active.h2}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="size-3.5" />
          </MenuButton>
          <MenuButton
            label="Bullet list"
            active={active.bulletList}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-3.5" />
          </MenuButton>
          <MenuButton
            label="Numbered list"
            active={active.orderedList}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-3.5" />
          </MenuButton>
          <MenuButton
            label="Quote"
            active={active.blockquote}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <TextQuote className="size-3.5" />
          </MenuButton>
          <MenuButton label="Link" active={active.link} onClick={openLinkEditor}>
            <Link2 className="size-3.5" />
          </MenuButton>
        </>
      )}
    </BubbleMenu>
  );
}

function MenuButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick(): void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
