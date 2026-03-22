"use client";

import { useMemo } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  List as ListIcon,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToggleCommand = {
  icon: React.ElementType;
  label: string;
  isActive: (editor: Editor | null) => boolean;
  onClick: (editor: Editor | null) => void;
};

export interface RichTextToolbarProps {
  editor: Editor | null;
  onOpenImagePicker?: () => void;
  className?: string;
}

export function RichTextToolbar({ editor, onOpenImagePicker, className }: RichTextToolbarProps) {
  const commands = useMemo<ToggleCommand[]>(
    () => [
      {
        icon: Bold,
        label: "Bold",
        isActive: (e) => Boolean(e?.isActive("bold")),
        onClick: (e) => e?.chain().focus().toggleBold().run(),
      },
      {
        icon: Italic,
        label: "Italic",
        isActive: (e) => Boolean(e?.isActive("italic")),
        onClick: (e) => e?.chain().focus().toggleItalic().run(),
      },
      {
        icon: Underline,
        label: "Underline",
        isActive: (e) => Boolean(e?.isActive("underline")),
        onClick: (e) => e?.chain().focus().toggleUnderline?.().run(),
      },
      {
        icon: Heading1,
        label: "Heading 1",
        isActive: (e) => Boolean(e?.isActive("heading", { level: 1 })),
        onClick: (e) => e?.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        icon: Heading2,
        label: "Heading 2",
        isActive: (e) => Boolean(e?.isActive("heading", { level: 2 })),
        onClick: (e) => e?.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        icon: Heading3,
        label: "Heading 3",
        isActive: (e) => Boolean(e?.isActive("heading", { level: 3 })),
        onClick: (e) => e?.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        icon: ListIcon,
        label: "Bullet List",
        isActive: (e) => Boolean(e?.isActive("bulletList")),
        onClick: (e) => e?.chain().focus().toggleBulletList().run(),
      },
      {
        icon: ListOrdered,
        label: "Ordered List",
        isActive: (e) => Boolean(e?.isActive("orderedList")),
        onClick: (e) => e?.chain().focus().toggleOrderedList().run(),
      },
      {
        icon: Quote,
        label: "Quote",
        isActive: (e) => Boolean(e?.isActive("blockquote")),
        onClick: (e) => e?.chain().focus().toggleBlockquote().run(),
      },
      {
        icon: Code,
        label: "Code",
        isActive: (e) => Boolean(e?.isActive("codeBlock")),
        onClick: (e) => e?.chain().focus().toggleCodeBlock().run(),
      },
    ],
    [],
  );

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border-ui)] bg-[var(--background-surface)]/90 px-2 py-1 shadow-sm backdrop-blur",
        className,
      )}
    >
      {commands.map(({ icon: Icon, label, isActive, onClick }) => (
        <Button
          key={label}
          type="button"
          size="icon"
          variant={isActive(editor) ? "default" : "ghost"}
          className={cn(
            "h-8 w-8 rounded-md",
            isActive(editor)
              ? "bg-emerald-600/90 text-white hover:bg-emerald-500"
              : "text-[var(--text-secondary)]",
          )}
          onClick={() => onClick(editor)}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      <div className="mx-2 h-6 w-px bg-[var(--border-ui)]" />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-[var(--text-secondary)]"
        onClick={() => editor.commands.undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-[var(--text-secondary)]"
        onClick={() => editor.commands.redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
      <div className="mx-2 h-6 w-px bg-[var(--border-ui)]" />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-[var(--text-secondary)]"
        onClick={onOpenImagePicker}
        title="Insert image"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
