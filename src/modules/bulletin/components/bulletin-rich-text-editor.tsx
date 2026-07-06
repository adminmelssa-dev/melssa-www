"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulletinRichTextEditorProps {
  "aria-label": string;
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

export function BulletinRichTextEditor({
  "aria-label": ariaLabel,
  disabled = false,
  onChange,
  placeholder,
  value,
}: BulletinRichTextEditorProps) {
  const hydratedRef = React.useRef(false);
  const normalizedContent = React.useMemo(() => toEditorHtml(value), [value]);
  const extensions = React.useMemo(
    () => [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        strike: false,
      }),
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        isAllowedUri: isSafePublicLinkUrl,
        linkOnPaste: true,
        openOnClick: false,
        protocols: ["http", "https", "mailto"],
        shouldAutoLink: isSafePublicLinkUrl,
      }),
      Placeholder.configure({ placeholder }),
    ],
    [placeholder],
  );
  const editor = useEditor({
    content: normalizedContent,
    editable: !disabled,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel,
      },
    },
    extensions,
    immediatelyRender: false,
    onUpdate({ editor: updatedEditor }) {
      if (!hydratedRef.current) return;
      onChange(normalizeEmptyHtml(updatedEditor.getHTML()));
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  React.useEffect(() => {
    if (!editor) return;

    if (editor.getHTML() !== normalizedContent) {
      hydratedRef.current = false;
      editor.commands.setContent(normalizedContent, { emitUpdate: false });
    }

    const timeout = window.setTimeout(() => {
      hydratedRef.current = true;
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [editor, normalizedContent]);

  function setLink(): void {
    if (!editor) return;

    const attrs = editor.getAttributes("link");
    const existingHref = typeof attrs.href === "string" ? attrs.href : "";
    const href = window.prompt("Link URL", existingHref);

    if (href === null) return;

    const trimmedHref = href.trim();

    if (trimmedHref.length === 0) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    if (!isSafePublicLinkUrl(trimmedHref)) {
      window.alert("Links must use http, https, mailto, or a site-relative path.");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmedHref })
      .run();
  }

  const editorDisabled = disabled || editor === null;

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b bg-paper-2 px-2 py-1.5">
        <ToolbarButton
          disabled={editorDisabled}
          label="Undo"
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          disabled={editorDisabled}
          label="Redo"
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          active={editor?.isActive("bulletList") ?? false}
          disabled={editorDisabled}
          label="Bulleted list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("orderedList") ?? false}
          disabled={editorDisabled}
          label="Numbered list"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("blockquote") ?? false}
          disabled={editorDisabled}
          label="Quote"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          active={editor?.isActive("bold") ?? false}
          disabled={editorDisabled}
          label="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("italic") ?? false}
          disabled={editorDisabled}
          label="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("link") ?? false}
          disabled={editorDisabled}
          label="Link"
          onClick={setLink}
        >
          <Link2 className="size-4" />
        </ToolbarButton>
      </div>

      {editor ? (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-1 rounded-lg border border-foreground/70 bg-foreground p-1 text-background shadow-lg"
        >
          <BubbleButton
            active={editor.isActive("bold")}
            label="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </BubbleButton>
          <BubbleButton
            active={editor.isActive("italic")}
            label="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </BubbleButton>
          <BubbleButton
            active={editor.isActive("link")}
            label="Link"
            onClick={setLink}
          >
            <Link2 className="size-4" />
          </BubbleButton>
        </BubbleMenu>
      ) : null}

      <EditorContent
        editor={editor}
        className={cn(
          "min-h-40 px-4 py-3 text-sm leading-6 text-foreground",
          "[&_.ProseMirror]:min-h-32 [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_p]:my-2",
          "[&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-gold [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:font-heading [&_.ProseMirror_blockquote]:text-base [&_.ProseMirror_blockquote]:italic",
          "[&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5",
          "[&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5",
          "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-4",
          "[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground/55 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          disabled ? "pointer-events-none opacity-70" : "",
        )}
      />
    </div>
  );
}

function ToolbarButton({
  active = false,
  children,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={label}
      className={cn("size-7", active && "bg-muted text-foreground")}
      disabled={disabled}
      onClick={onClick}
      size="icon-sm"
      title={label}
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  );
}

function BubbleButton({
  active = false,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid size-7 place-items-center rounded-md transition-colors",
        active ? "bg-background text-foreground" : "text-background/75 hover:bg-background/15",
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}

function toEditorHtml(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) return "<p></p>";
  if (looksLikeHtml(trimmedValue)) return trimmedValue;

  return trimmedValue
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function normalizeEmptyHtml(value: string): string {
  return value === "<p></p>" ? "" : value;
}

function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

function escapeHtml(value: string): string {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => {
    return replacements[character] ?? character;
  });
}

function isSafePublicLinkUrl(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) return true;

  try {
    const parsedUrl = new URL(url);
    return ["http:", "https:", "mailto:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}
