import { describe, expect, it } from "vitest";
import { isRichTextEmpty, isSafeHref, sanitizeRichText } from "@/lib/content/rich-text";

describe("sanitizeRichText", () => {
  it("rejects non-documents", () => {
    expect(sanitizeRichText(null)).toBeNull();
    expect(sanitizeRichText("<p>hi</p>")).toBeNull();
    expect(sanitizeRichText({ type: "paragraph" })).toBeNull();
  });

  it("keeps allowed nodes and marks", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Título" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Negrito", marks: [{ type: "bold" }] },
            { type: "text", text: "link", marks: [{ type: "link", attrs: { href: "https://example.com", target: "_blank" } }] },
          ],
        },
      ],
    };
    expect(sanitizeRichText(doc)).toEqual({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Título" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Negrito", marks: [{ type: "bold" }] },
            { type: "text", text: "link", marks: [{ type: "link", attrs: { href: "https://example.com" } }] },
          ],
        },
      ],
    });
  });

  it("drops unknown nodes, unsafe links and invalid heading levels", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "image", attrs: { src: "x" } },
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "H" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }, { type: "code" }] },
          ],
        },
      ],
    };
    expect(sanitizeRichText(doc)).toEqual({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "H" }] },
        { type: "paragraph", content: [{ type: "text", text: "x" }] },
      ],
    });
  });
});

describe("isSafeHref", () => {
  it.each(["https://a.com", "http://a.com/x", "mailto:a@b.com", "/pt/aulas", "#secao"])("accepts %s", (href) => {
    expect(isSafeHref(href)).toBe(true);
  });
  it.each(["javascript:alert(1)", "data:text/html,x", "//evil.com", "", "vbscript:x"])("rejects %s", (href) => {
    expect(isSafeHref(href)).toBe(false);
  });
});

describe("isRichTextEmpty", () => {
  it("treats whitespace-only docs as empty", () => {
    expect(isRichTextEmpty({ type: "doc", content: [{ type: "paragraph" }] })).toBe(true);
    expect(isRichTextEmpty({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "   " }] }] })).toBe(true);
    expect(isRichTextEmpty({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Oi" }] }] })).toBe(false);
  });
});
