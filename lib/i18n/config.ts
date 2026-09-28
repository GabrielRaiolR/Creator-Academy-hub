export const locales = ["pt-BR", "bn-BD"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";

/** Short URL segment for each locale: `/pt/...`, `/bn/...`. */
export const localeSegments = {
  "pt-BR": "pt",
  "bn-BD": "bn",
} as const satisfies Record<Locale, string>;

export type LocaleSegment = (typeof localeSegments)[Locale];

export const segments = locales.map((locale) => localeSegments[locale]);

export const defaultSegment: LocaleSegment = localeSegments[defaultLocale];

/** Language names are always shown in their own language. */
export const localeNames: Record<Locale, string> = {
  "pt-BR": "Português",
  "bn-BD": "বাংলা",
};

export const localeShortNames: Record<Locale, string> = {
  "pt-BR": "PT",
  "bn-BD": "বাং",
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function isLocaleSegment(value: unknown): value is LocaleSegment {
  return typeof value === "string" && (segments as readonly string[]).includes(value);
}

export function segmentToLocale(segment: LocaleSegment): Locale {
  const match = locales.find((locale) => localeSegments[locale] === segment);
  return match ?? defaultLocale;
}

export function localeToSegment(locale: Locale): LocaleSegment {
  return localeSegments[locale];
}

/** Builds an app path for the given locale segment: `localePath("bn", "/aulas")` → `/bn/aulas`. */
export function localePath(segment: LocaleSegment, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? `/${segment}` : `/${segment}${normalized}`;
}

/**
 * Swaps the locale segment of a pathname, preserving the rest of the route:
 * `/pt/aulas/minha-aula` → `/bn/aulas/minha-aula`.
 */
export function switchLocaleInPath(pathname: string, target: LocaleSegment): string {
  const parts = pathname.split("/");
  if (isLocaleSegment(parts[1])) {
    parts[1] = target;
    return parts.join("/") || `/${target}`;
  }
  return localePath(target, pathname);
}

/**
 * Picks the best segment from an Accept-Language header.
 * Only the primary language subtag matters here (bn, pt).
 */
export function segmentFromAcceptLanguage(header: string | null | undefined): LocaleSegment {
  if (!header) return defaultSegment;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const primary = tag.split("-")[0];
    if (isLocaleSegment(primary)) return primary;
  }
  return defaultSegment;
}
