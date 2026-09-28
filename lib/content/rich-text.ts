/**
 * Lesson bodies are stored as Tiptap/ProseMirror JSON, never as HTML.
 * Everything that reaches the database goes through `sanitizeRichText`, which keeps
 * only the node types, marks and attributes the editor is allowed to produce.
 */

export type RichTextMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type RichTextNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
};

export type RichTextDoc = {
  type: "doc";
  content: RichTextNode[];
};

const BLOCK_NODES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
]);
const INLINE_NODES = new Set(["text", "hardBreak"]);
const MARKS = new Set(["bold", "italic", "link"]);
const HEADING_LEVELS = new Set([2, 3]);
const MAX_DEPTH = 12;

export function emptyRichText(): RichTextDoc {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

/** Accepts http(s), mailto and in-app relative links; rejects javascript:, data:, etc. */
export function isSafeHref(href: unknown): href is string {
  if (typeof href !== "string") return false;
  const value = href.trim();
  if (!value || value.length > 2048) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#")) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeMarks(value: unknown): RichTextMark[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const marks: RichTextMark[] = [];
  for (const mark of value) {
    if (!isRecord(mark) || typeof mark.type !== "string" || !MARKS.has(mark.type)) continue;
    if (mark.type === "link") {
      const href = isRecord(mark.attrs) ? mark.attrs.href : undefined;
      if (!isSafeHref(href)) continue;
      marks.push({ type: "link", attrs: { href: href.trim() } });
    } else {
      marks.push({ type: mark.type });
    }
  }
  return marks.length ? marks : undefined;
}

function sanitizeNode(value: unknown, depth: number): RichTextNode | null {
  if (!isRecord(value) || typeof value.type !== "string" || depth > MAX_DEPTH) return null;
  const { type } = value;

  if (type === "text") {
    if (typeof value.text !== "string" || value.text.length === 0) return null;
    const node: RichTextNode = { type, text: value.text };
    const marks = sanitizeMarks(value.marks);
    if (marks) node.marks = marks;
    return node;
  }

  if (type === "hardBreak") return { type };
  if (!BLOCK_NODES.has(type)) return null;

  const node: RichTextNode = { type };
  if (type === "heading") {
    const level = isRecord(value.attrs) ? Number(value.attrs.level) : 2;
    node.attrs = { level: HEADING_LEVELS.has(level) ? level : 2 };
  }
  if (type === "orderedList" && isRecord(value.attrs)) {
    const start = Number(value.attrs.start);
    if (Number.isInteger(start) && start > 1 && start < 10_000) node.attrs = { start };
  }

  if (Array.isArray(value.content)) {
    const children = value.content
      .map((child) => sanitizeNode(child, depth + 1))
      .filter((child): child is RichTextNode => child !== null)
      .filter((child) =>
        // inline content only inside paragraphs/headings; block content elsewhere
        type === "paragraph" || type === "heading"
          ? INLINE_NODES.has(child.type)
          : !INLINE_NODES.has(child.type),
      );
    if (children.length) node.content = children;
  }

  return node;
}

/** Returns a clean document, or null when the input is not a Tiptap document at all. */
export function sanitizeRichText(value: unknown): RichTextDoc | null {
  if (!isRecord(value) || value.type !== "doc") return null;
  const content = Array.isArray(value.content)
    ? value.content
        .map((child) => sanitizeNode(child, 1))
        .filter((child): child is RichTextNode => child !== null && !INLINE_NODES.has(child.type))
    : [];
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

function hasText(node: RichTextNode): boolean {
  if (node.type === "text") return Boolean(node.text?.trim());
  return node.content?.some(hasText) ?? false;
}

export function isRichTextEmpty(doc: RichTextDoc | null | undefined): boolean {
  return !doc || !doc.content.some(hasText);
}
