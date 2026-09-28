import type { ReactNode } from "react";
import { isSafeHref, sanitizeRichText, type RichTextMark, type RichTextNode } from "@/lib/content/rich-text";
import { cn } from "@/lib/utils";

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

function renderChildren(nodes: RichTextNode[] | undefined, key: string): ReactNode {
  return nodes?.map((node, index) => renderNode(node, `${key}-${index}`));
}

function renderNode(node: RichTextNode, key: string): ReactNode {
  switch (node.type) {
    case "text":
      return renderMarks(node.text, node.marks, key);
    case "hardBreak":
      return <br key={key} />;
    case "paragraph":
      return <p key={key}>{renderChildren(node.content, key)}</p>;
    case "heading":
      return node.attrs?.level === 3 ? (
        <h3 key={key}>{renderChildren(node.content, key)}</h3>
      ) : (
        <h2 key={key}>{renderChildren(node.content, key)}</h2>
      );
    case "bulletList":
      return <ul key={key}>{renderChildren(node.content, key)}</ul>;
    case "orderedList": {
      const start = typeof node.attrs?.start === "number" ? node.attrs.start : undefined;
      return (
        <ol key={key} start={start}>
          {renderChildren(node.content, key)}
        </ol>
      );
    }
    case "listItem":
      return <li key={key}>{renderChildren(node.content, key)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node.content, key)}</blockquote>;
    default:
      return null;
  }
}

/**
 * Renders stored lesson content as React elements. The document is sanitized again on
 * read, so even a row edited directly in the database cannot inject markup or scripts.
 */
export function RichText({ content, className, lang }: { content: unknown; className?: string; lang?: string }) {
  const doc = sanitizeRichText(content);
  if (!doc) return null;
  return (
    <div className={cn("rich-text", className)} lang={lang}>
      {renderChildren(doc.content, "n")}
    </div>
  );
}
