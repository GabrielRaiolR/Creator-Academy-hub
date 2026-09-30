import type { RichTextDoc, RichTextNode } from "./rich-text";

/** Characters of surrounding text kept so the same sentence can be found again after a small edit nearby. */
export const NOTE_CONTEXT = 32;
export const NOTE_QUOTE_MAX = 800;

const INLINE = new Set(["text", "hardBreak"]);

export type TextPiece = { kind: "text"; text: string; start: number } | { kind: "gap"; start: number };

export type NoteAnchor = {
  quote: string;
  prefix: string;
  suffix: string;
  position: number;
};

export type StoredNote = NoteAnchor & {
  id: string;
  body: string;
};

export type TextSlice = {
  text: string;
  start: number;
  noteIds: string[];
  /** Notes whose highlighted range ends at the end of this slice. */
  endNoteIds: string[];
};

/**
 * Reads the lesson in the same order the reader renders it.
 * A newline separates blocks and hard breaks, so a selection that crosses a paragraph stays one quote.
 */
export function textPieces(doc: RichTextDoc): TextPiece[] {
  const pieces: TextPiece[] = [];
  const len = { n: 0 };

  const gap = () => {
    pieces.push({ kind: "gap", start: len.n });
    len.n += 1;
  };
  const text = (value: string) => {
    pieces.push({ kind: "text", text: value, start: len.n });
    len.n += value.length;
  };
  const walkInline = (nodes: RichTextNode[] | undefined) => {
    for (const node of nodes ?? []) {
      if (node.type === "text" && node.text) text(node.text);
      else if (node.type === "hardBreak") gap();
    }
  };
  const walkBlocks = (nodes: RichTextNode[] | undefined) => {
    const blocks = (nodes ?? []).filter((node) => !INLINE.has(node.type));
    blocks.forEach((node, index) => {
      if (index > 0) gap();
      if (node.type === "paragraph" || node.type === "heading") walkInline(node.content);
      else walkBlocks(node.content);
    });
  };

  walkBlocks(doc.content);
  return pieces;
}

export function flattenRichText(doc: RichTextDoc): string {
  return textPieces(doc)
    .map((piece) => (piece.kind === "text" ? piece.text : "\n"))
    .join("");
}

/** Finds the quote. Prefix, suffix and the original position pick the right copy when the sentence repeats. */
export function locateQuote(text: string, anchor: NoteAnchor): { start: number; end: number } | null {
  const { quote } = anchor;
  if (!quote) return null;

  const matches: { start: number; score: number; distance: number }[] = [];
  let from = 0;
  while (from <= text.length) {
    const start = text.indexOf(quote, from);
    if (start === -1) break;
    const before = text.slice(Math.max(0, start - anchor.prefix.length), start);
    const after = text.slice(start + quote.length, start + quote.length + anchor.suffix.length);
    let score = 0;
    if (anchor.prefix && before.endsWith(anchor.prefix)) score += 2;
    else if (anchor.prefix.length >= 8 && before.endsWith(anchor.prefix.slice(-8))) score += 1;
    if (anchor.suffix && after.startsWith(anchor.suffix)) score += 2;
    else if (anchor.suffix.length >= 8 && after.startsWith(anchor.suffix.slice(0, 8))) score += 1;
    matches.push({ start, score, distance: Math.abs(start - anchor.position) });
    from = start + Math.max(1, quote.length);
  }

  if (!matches.length) return null;
  matches.sort((a, b) => b.score - a.score || a.distance - b.distance);
  const best = matches[0];
  return { start: best.start, end: best.start + quote.length };
}

export function anchorNotes(text: string, notes: StoredNote[]) {
  const anchored: { note: StoredNote; start: number; end: number }[] = [];
  const orphans: StoredNote[] = [];
  for (const note of notes) {
    const range = locateQuote(text, note);
    if (!range) orphans.push(note);
    else anchored.push({ note, start: range.start, end: range.end });
  }
  return { anchored, orphans };
}

/** Splits one text node where highlights begin and end. */
export function sliceHighlights(
  text: string,
  start: number,
  ranges: { id: string; start: number; end: number }[],
): TextSlice[] {
  const end = start + text.length;
  const points = new Set<number>([start, end]);
  for (const range of ranges) {
    if (range.end <= start || range.start >= end) continue;
    if (range.start > start && range.start < end) points.add(range.start);
    if (range.end > start && range.end < end) points.add(range.end);
  }
  const sorted = [...points].sort((a, b) => a - b);
  const slices: TextSlice[] = [];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const sliceStart = sorted[index];
    const sliceEnd = sorted[index + 1];
    if (sliceStart === undefined || sliceEnd === undefined) continue;
    slices.push({
      text: text.slice(sliceStart - start, sliceEnd - start),
      start: sliceStart,
      noteIds: ranges.filter((range) => range.start < sliceEnd && range.end > sliceStart).map((range) => range.id),
      endNoteIds: ranges.filter((range) => range.end === sliceEnd && range.start < sliceEnd).map((range) => range.id),
    });
  }
  return slices;
}
