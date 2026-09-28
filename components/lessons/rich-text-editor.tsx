"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Undo2,
  Unlink,
} from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { isSafeHref, type RichTextDoc } from "@/lib/content/rich-text";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: RichTextDoc;
  onChange: (value: RichTextDoc) => void;
  lang: string;
  labelledBy: string;
  invalid?: boolean;
};

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg transition-colors disabled:opacity-30",
        active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-zinc-200" />;
}

const icon = "size-4";

function Toolbar({ editor, onLink }: { editor: Editor; onLink: () => void }) {
  const { t } = useI18n();
  const r = t.richText;
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      paragraph: current.isActive("paragraph"),
      h2: current.isActive("heading", { level: 2 }),
      h3: current.isActive("heading", { level: 3 }),
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      bulletList: current.isActive("bulletList"),
      orderedList: current.isActive("orderedList"),
      blockquote: current.isActive("blockquote"),
      link: current.isActive("link"),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label={r.toolbar}
      className="no-scrollbar flex items-center gap-0.5 overflow-x-auto border-b border-zinc-100 bg-zinc-50/80 p-1.5"
    >
      <ToolbarButton label={r.paragraph} active={state.paragraph} onClick={() => chain().setParagraph().run()}>
        <Pilcrow aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label={r.heading2} active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label={r.heading3} active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
      <Separator />
      <ToolbarButton label={r.bold} active={state.bold} onClick={() => chain().toggleBold().run()}>
        <Bold aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label={r.italic} active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label={r.link} active={state.link} onClick={onLink}>
        <Link2 aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
      <Separator />
      <ToolbarButton label={r.bulletList} active={state.bulletList} onClick={() => chain().toggleBulletList().run()}>
        <List aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label={r.orderedList} active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label={r.blockquote} active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
      <Separator />
      <ToolbarButton label={r.undo} disabled={!state.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton label={r.redo} disabled={!state.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 aria-hidden className={icon} strokeWidth={1.5} />
      </ToolbarButton>
    </div>
  );
}

/** Inline link editor (no window.prompt, works on touch devices). */
function LinkBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const { t } = useI18n();
  const r = t.richText;
  const inputId = useId();
  const [href, setHref] = useState<string>(() => String(editor.getAttributes("link").href ?? ""));
  const [error, setError] = useState(false);

  const apply = () => {
    const value = href.trim();
    if (!value) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      onClose();
      return;
    }
    const normalized = /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(value) ? `https://${value}` : value;
    if (!isSafeHref(normalized)) {
      setError(true);
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
    onClose();
  };

  return (
    <div className="flex flex-col gap-2 border-b border-zinc-100 bg-white p-2 sm:flex-row sm:items-center">
      <label htmlFor={inputId} className="sr-only">
        {r.link}
      </label>
      <Input
        id={inputId}
        type="url"
        inputMode="url"
        autoFocus
        value={href}
        placeholder={r.linkPlaceholder}
        aria-invalid={error || undefined}
        onChange={(event) => {
          setHref(event.target.value);
          setError(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            apply();
          }
          if (event.key === "Escape") onClose();
        }}
        className="h-9 flex-1"
      />
      <div className="flex gap-1">
        <Button size="sm" variant="dark" onClick={apply}>
          {r.applyLink}
        </Button>
        {editor.isActive("link") ? (
          <Button
            size="sm"
            variant="ghost"
            icon={<Unlink aria-hidden className="size-3.5" strokeWidth={1.5} />}
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              onClose();
            }}
          >
            {r.removeLink}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t.common.cancel}
        </Button>
      </div>
      {error ? <p className="text-xs font-medium text-red-600 sm:basis-full">{r.invalidLink}</p> : null}
    </div>
  );
}

/**
 * Deliberately small Tiptap setup: headings (2–3), paragraphs, bold, italic, links,
 * lists and quotes. Output is JSON; the server sanitizes it again before saving.
 */
export function RichTextEditor({ value, onChange, lang, labelledBy, invalid }: RichTextEditorProps) {
  const { t } = useI18n();
  const [linkOpen, setLinkOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          isAllowedUri: (url) => isSafeHref(url),
        },
      }),
      Placeholder.configure({ placeholder: t.richText.placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rich-text px-4 py-4 sm:px-5",
        lang,
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelledBy,
        ...(invalid ? { "aria-invalid": "true" } : {}),
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON() as RichTextDoc),
  });

  return (
    <div
      lang={lang}
      className={cn(
        "rich-text-editor overflow-hidden rounded-xl border bg-white transition-colors focus-within:border-blue-primary/50 focus-within:ring-2 focus-within:ring-blue-primary/25",
        invalid ? "border-red-300" : "border-zinc-200",
      )}
    >
      {editor ? (
        <>
          <Toolbar editor={editor} onLink={() => setLinkOpen((open) => !open)} />
          {linkOpen ? <LinkBar editor={editor} onClose={() => setLinkOpen(false)} /> : null}
        </>
      ) : (
        <div className="h-12 border-b border-zinc-100 bg-zinc-50/80" />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
