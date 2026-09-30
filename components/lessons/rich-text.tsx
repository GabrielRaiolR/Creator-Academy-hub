import { MessageSquare } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { sliceHighlights, textPieces, type TextPiece } from "@/lib/content/note-anchor";
import { isSafeHref, sanitizeRichText, type RichTextMark, type RichTextNode } from "@/lib/content/rich-text";
import { cn } from "@/lib/utils";

export type TextHighlight = { id: string; start: number; end: number };

type RenderContext = {
  pieces: TextPiece[];
  index: number;
  ranges: TextHighlight[];
  noteLabel?: string;
};

function renderMarks(text: ReactNode, marks: RichTextMark[] | undefined, key: string): ReactNode {
  if (!marks) return text;
  return marks.reduce<ReactNode>((child, mark, index) => {
    const markKey = `${key}-m${index}`;
    if (mark.type === "bold") return <strong key={markKey}>{child}</strong>;
    if (mark.type === "italic") return <em key={markKey}>{child}</em>;
    if (mark.type === "link" && isSafeHref(mark.attrs?.href)) {
      const href = mark.attrs.href;
      const external = /^https?:/i.test(href);
      return (
        <a key={markKey} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
          {child}
        </a>
      );
    }
    return child;
  }, text);
}

function takeText(context: RenderContext, text: string): number {
  while (context.pieces[context.index]?.kind === "gap") context.index += 1;
  const piece = context.pieces[context.index];
  if (!piece || piece.kind !== "text" || piece.text !== text) return -1;
  context.index += 1;
  return piece.start;
}

function renderChildren(nodes: RichTextNode[] | undefined, key: string, context: RenderContext): ReactNode {
  return nodes?.map((node, index) => renderNode(node, `${key}-${index}`, context));
}

function renderNode(node: RichTextNode, key: string, context: RenderContext): ReactNode {
  switch (node.type) {
    case "text": {
      const value = node.text ?? "";
      const start = takeText(context, value);
      const slices =
        start < 0
          ? [{ text: value, start: 0, noteIds: [] as string[], endNoteIds: [] as string[] }]
          : sliceHighlights(value, start, context.ranges);
      return (
        <Fragment key={key}>
          {slices.map((slice) => {
            const marked = slice.noteIds.length ? (
              <mark data-open-note={slice.noteIds[0]} className="cursor-pointer rounded-sm bg-zinc-200/90 text-inherit">
                <span data-offset={slice.start}>{slice.text}</span>
              </mark>
            ) : (
              <span data-offset={start < 0 ? undefined : slice.start}>{slice.text}</span>
            );
            return (
              <Fragment key={slice.start}>
                {renderMarks(marked, node.marks, `${key}-${slice.start}`)}
                {slice.endNoteIds.map((id) => (
                  <button
                    key={`${key}-note-${id}`}
                    type="button"
                    data-open-note={id}
                    aria-label={context.noteLabel}
                    className="relative -top-1 ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-white align-super text-zinc-500 shadow-ring select-none"
                  >
                    <MessageSquare aria-hidden className="size-3" strokeWidth={1.5} />
                  </button>
                ))}
              </Fragment>
            );
          })}
        </Fragment>
      );
    }
    case "hardBreak":
      return <br key={key} />;
    case "paragraph":
      return <p key={key}>{renderChildren(node.content, key, context)}</p>;
    case "heading":
      return node.attrs?.level === 3 ? (
        <h3 key={key}>{renderChildren(node.content, key, context)}</h3>
      ) : (
        <h2 key={key}>{renderChildren(node.content, key, context)}</h2>
      );
    case "bulletList":
      return <ul key={key}>{renderChildren(node.content, key, context)}</ul>;
    case "orderedList": {
      const listStart = typeof node.attrs?.start === "number" ? node.attrs.start : undefined;
      return (
        <ol key={key} start={listStart}>
          {renderChildren(node.content, key, context)}
        </ol>
      );
    }
    case "listItem":
      return <li key={key}>{renderChildren(node.content, key, context)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node.content, key, context)}</blockquote>;
    default:
      return null;
  }
}

/**
 * Renders stored lesson content as React elements. The document is sanitized again on
 * read, so even a row edited directly in the database cannot inject markup or scripts.
 * Highlights are the reader's own notes, matched by quote, and never written back into the lesson.
 */
export function RichText({
  content,
  className,
  lang,
  highlights,
  noteLabel,
}: {
  content: unknown;
  className?: string;
  lang?: string;
  highlights?: TextHighlight[];
  noteLabel?: string;
}) {
  const doc = sanitizeRichText(content);
  if (!doc) return null;
  const context: RenderContext = {
    pieces: textPieces(doc),
    index: 0,
    ranges: highlights ?? [],
    noteLabel,
  };
  return (
    <div className={cn("rich-text", className)} lang={lang}>
      {renderChildren(doc.content, "n", context)}
    </div>
  );
}
