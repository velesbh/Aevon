"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { EditorContent, useEditor, type Editor, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import { cn } from "@/lib/utils";
import { RichTextToolbar } from "./rich-text-toolbar";
import { createMentionSuggestion } from "./mention-suggestion";
import type { MentionEntity } from "./mention-data";
import { createSlashSuggestion } from "./slash-suggestion";
import { MentionNodeView } from "./mention-node-view";

export interface RichTextEditorHandle {
  insertImage: (url: string) => void;
  focus: () => void;
  getEditor: () => Editor | null;
}

export interface RichTextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  mentionItems?: MentionEntity[];
  readOnly?: boolean;
  className?: string;
  contentClassName?: string;
  minHeight?: number | string;
  showToolbar?: boolean;
  onOpenImagePicker?: () => void;
  variant?: "default" | "manuscript";
  onEditorReady?: (editor: Editor) => void;
}

const MentionExtension = Mention.extend({
  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
      type: { default: null },
      description: { default: null },
      folderCategory: { default: null },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView);
  },
});

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  (
    {
      value,
      onChange,
      placeholder,
      mentionItems,
      readOnly = false,
      className,
      contentClassName,
      minHeight,
      showToolbar = true,
      onOpenImagePicker,
      variant = "default",
      onEditorReady,
    },
    ref,
  ) => {
    const mentionSuggestion = useMemo(
      () =>
        createMentionSuggestion(() => mentionItems ?? [], {
          maxResults: 24,
          recentLimit: 12,
        }),
      [mentionItems],
    );

    const slashSuggestion = useMemo(() => createSlashSuggestion(), []);

    const editor = useEditor(
      {
        immediatelyRender: false,
        extensions: [
          StarterKit.configure({
            heading: { levels: [1, 2, 3] },
            orderedList: { keepMarks: true },
            bulletList: {},
          }),
          Placeholder.configure({
            placeholder: placeholder ?? "Start writing...",
          }),
          MentionExtension.configure({
            HTMLAttributes: {
              class: "mention",
            },
            suggestion: mentionSuggestion,
          }),
          Mention.extend({
            name: "slash-command",
          }).configure({
            suggestion: slashSuggestion,
          }),
          Image.configure({ inline: false }),
        ],
        content: value || "",
        editable: !readOnly,
        onUpdate({ editor: instance }) {
          onChange?.(instance.getHTML());
        },
        editorProps: {
          attributes: {
            class: cn(
              "ProseMirror prose prose-neutral dark:prose-invert max-w-none focus:outline-none",
              variant === "manuscript" 
                ? "font-serif text-lg leading-loose prose-headings:font-serif prose-p:mb-4 prose-p:leading-8" 
                : "text-base leading-relaxed"
            ),
          },
        },
        onCreate({ editor }) {
          onEditorReady?.(editor);
        },
      },
      [], // Only initialize once
    );

    // Sync value from props if it changes externally
    useEffect(() => {
      if (!editor || readOnly) return;
      
      const currentContent = editor.getHTML();
      if (value !== currentContent && value !== undefined) {
        // If the editor is focused, we likely don't want to update unless it's a completely different document
        // For autosave, value should match currentContent anyway or be close enough.
        // Skipping update when focused prevents the editor from jumping to the top.
        if (editor.isFocused) {
          return;
        }
        editor.commands.setContent(value, { emitUpdate: false });
      }
    }, [value, editor, readOnly]);

    useImperativeHandle(
      ref,
      () => ({
        insertImage: (url: string) => {
          if (!editor || !url) return;
          editor.chain().focus().setImage({ src: url }).run();
        },
        focus: () => {
          editor?.commands.focus();
        },
        getEditor: () => editor ?? null,
      }),
      [editor],
    );

    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!readOnly);
    }, [editor, readOnly]);

    useEffect(() => {
      if (!editor) return;
      editor.setOptions({
        editorProps: {
          attributes: {
            class: cn(
              "ProseMirror prose prose-neutral dark:prose-invert max-w-none focus:outline-none",
              variant === "manuscript" 
                ? "font-serif text-lg leading-loose prose-headings:font-serif prose-p:mb-4 prose-p:leading-8" 
                : "text-base leading-relaxed"
            ),
          },
        },
      });
    }, [editor, variant]);

    useEffect(() => {
      const handleOpenPicker = () => {
        onOpenImagePicker?.();
      };
      window.addEventListener("aevon:open-image-picker", handleOpenPicker);
      return () => window.removeEventListener("aevon:open-image-picker", handleOpenPicker);
    }, [onOpenImagePicker]);

    return (
      <div className={cn("rich-text-editor space-y-2", className)}>
        {showToolbar && !readOnly ? (
          <RichTextToolbar editor={editor} onOpenImagePicker={onOpenImagePicker} />
        ) : null}
        <div
          className={cn(
            "rich-text-editor__surface border border-[var(--border-ui)] rounded-xl bg-[var(--background-app)] px-4 py-3 shadow-sm",
            readOnly && "bg-transparent shadow-none",
            variant === "manuscript" && "border-none shadow-none bg-transparent px-0 py-0",
            contentClassName,
          )}
          style={{ minHeight }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  },
);

RichTextEditor.displayName = "RichTextEditor";

export type { MentionEntity };
