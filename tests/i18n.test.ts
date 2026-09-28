import { describe, expect, it } from "vitest";
import { localePath, segmentFromAcceptLanguage, switchLocaleInPath } from "@/lib/i18n/config";

describe("switchLocaleInPath", () => {
  it("preserves the current route", () => {
    expect(switchLocaleInPath("/pt/aulas/minha-primeira-aula", "bn")).toBe("/bn/aulas/minha-primeira-aula");
    expect(switchLocaleInPath("/bn", "pt")).toBe("/pt");
    expect(switchLocaleInPath("/pt/admin/aulas/123", "bn")).toBe("/bn/admin/aulas/123");
  });
  it("prefixes paths without locale", () => {
    expect(switchLocaleInPath("/aulas", "bn")).toBe("/bn/aulas");
  });
});

describe("localePath", () => {
  it("builds localized paths", () => {
    expect(localePath("pt")).toBe("/pt");
    expect(localePath("bn", "/aulas")).toBe("/bn/aulas");
    expect(localePath("bn", "perfil")).toBe("/bn/perfil");
  });
});

describe("segmentFromAcceptLanguage", () => {
  it("honours quality ordering", () => {
    expect(segmentFromAcceptLanguage("bn-BD,bn;q=0.9,en;q=0.8")).toBe("bn");
    expect(segmentFromAcceptLanguage("en-US,pt-BR;q=0.5,bn;q=0.7")).toBe("bn");
    expect(segmentFromAcceptLanguage("pt-BR,pt;q=0.9")).toBe("pt");
  });
  it("falls back to Portuguese", () => {
    expect(segmentFromAcceptLanguage("en-US")).toBe("pt");
    expect(segmentFromAcceptLanguage(null)).toBe("pt");
  });
});
