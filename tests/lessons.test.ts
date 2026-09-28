import { describe, expect, it } from "vitest";
import type { RichTextDoc } from "@/lib/content/rich-text";
import { getPublishIssues } from "@/lib/lessons/publish";
import { isValidSlug, slugify } from "@/lib/slug";

const body = (text: string): RichTextDoc => ({
  type: "doc",
  content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : undefined }],
});

describe("slug", () => {
  it("slugifies Portuguese titles", () => {
    expect(slugify("Minha Primeira Aula: Introdução!")).toBe("minha-primeira-aula-introducao");
  });
  it("returns empty for Bengali-only titles", () => {
    expect(slugify("আমার প্রথম পাঠ")).toBe("");
  });
  it("validates slugs", () => {
    expect(isValidSlug("minha-aula-1")).toBe(true);
    expect(isValidSlug("Minha Aula")).toBe(false);
    expect(isValidSlug("-aula")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });
});

describe("getPublishIssues", () => {
  it("passes when both translations are complete (video and PDF are optional)", () => {
    expect(
      getPublishIssues({
        slug: "aula",
        translations: {
          "pt-BR": { title: "Aula", content: body("Texto") },
          "bn-BD": { title: "পাঠ", content: body("লেখা") },
        },
      }),
    ).toEqual([]);
  });

  it("passes with a single complete language", () => {
    expect(
      getPublishIssues({
        slug: "aula",
        translations: { "bn-BD": { title: "পাঠ", content: body("লেখা") } },
      }),
    ).toEqual([]);
  });

  it("reports a started-but-empty language, a bad slug, and no complete language", () => {
    expect(
      getPublishIssues({
        slug: "Bad Slug",
        translations: {
          "pt-BR": { title: "", content: body("Texto") },
          "bn-BD": { title: "", content: body("") },
        },
      }),
    ).toEqual([{ code: "INVALID_SLUG" }, { code: "MISSING_TITLE", locale: "pt-BR" }, { code: "NO_LANGUAGE" }]);
  });

  it("reports missing content only", () => {
    expect(
      getPublishIssues({
        slug: "aula",
        translations: { "pt-BR": { title: "Aula", content: body("") }, "bn-BD": { title: "পাঠ", content: body("x") } },
      }),
    ).toEqual([{ code: "MISSING_CONTENT", locale: "pt-BR" }]);
  });
});
