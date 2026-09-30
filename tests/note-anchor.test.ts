import { describe, expect, it } from "vitest";
import {
  anchorNotes,
  flattenRichText,
  locateQuote,
  sliceHighlights,
  type StoredNote,
} from "@/lib/content/note-anchor";
import type { RichTextDoc } from "@/lib/content/rich-text";

const doc: RichTextDoc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Olá mundo cruel" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Uma frase." },
        { type: "hardBreak" },
        { type: "text", text: "Outra frase com mundo." },
      ],
    },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Primeiro" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Segundo" }] }] },
      ],
    },
  ],
};

const flat = "Olá mundo cruel\nUma frase.\nOutra frase com mundo.\nPrimeiro\nSegundo";

function note(partial: Partial<StoredNote> & Pick<StoredNote, "id" | "quote">): StoredNote {
  return { prefix: "", suffix: "", position: 0, body: "nota", ...partial };
}

describe("flattenRichText", () => {
  it("joins blocks and hard breaks with newlines, in reading order", () => {
    expect(flattenRichText(doc)).toBe(flat);
  });
});

describe("locateQuote", () => {
  it("uses the surrounding text when the same word appears twice", () => {
    const first = locateQuote(flat, { quote: "mundo", prefix: "Olá ", suffix: " cruel", position: 0 });
    const second = locateQuote(flat, { quote: "mundo", prefix: "com ", suffix: ".", position: 40 });
    expect(first).toEqual({ start: flat.indexOf("mundo"), end: flat.indexOf("mundo") + "mundo".length });
    expect(second?.start).toBe(flat.lastIndexOf("mundo"));
  });

  it("picks the occurrence closest to where the reader selected it", () => {
    const text = "aa bb aa";
    const range = locateQuote(text, { quote: "aa", prefix: "", suffix: "", position: 6 });
    expect(range).toEqual({ start: 6, end: 8 });
  });

  it("returns null when the passage was rewritten", () => {
    expect(locateQuote(flat, { quote: "frase apagada", prefix: "", suffix: "", position: 0 })).toBeNull();
  });
});

describe("anchorNotes", () => {
  it("keeps a rewritten passage as an orphan instead of dropping the note", () => {
    const { anchored, orphans } = anchorNotes(flat, [
      note({ id: "1", quote: "Olá mundo", position: 0 }),
      note({ id: "2", quote: "isso saiu da aula" }),
    ]);
    expect(anchored.map((item) => item.note.id)).toEqual(["1"]);
    expect(orphans.map((item) => item.id)).toEqual(["2"]);
  });
});

describe("sliceHighlights", () => {
  it("splits a text node at the highlight edges and marks where the note button goes", () => {
    const slices = sliceHighlights("Olá mundo cruel", 0, [{ id: "1", start: 4, end: 9 }]);
    expect(slices).toEqual([
      { text: "Olá ", start: 0, noteIds: [], endNoteIds: [] },
      { text: "mundo", start: 4, noteIds: ["1"], endNoteIds: ["1"] },
      { text: " cruel", start: 9, noteIds: [], endNoteIds: [] },
    ]);
  });
});
