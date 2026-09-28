import { defaultLocale, type Locale } from "@/lib/i18n/config";

/**
 * Picks the translation for the requested locale. Published lessons always have every locale,
 * but drafts in preview may not — in that case we fall back instead of rendering nothing.
 */
export function pickTranslation<T extends { locale: Locale }>(
  translations: readonly T[],
  locale: Locale,
): { translation: T | undefined; isFallback: boolean } {
  const exact = translations.find((item) => item.locale === locale);
  if (exact) return { translation: exact, isFallback: false };
  const fallback = translations.find((item) => item.locale === defaultLocale) ?? translations[0];
  return { translation: fallback, isFallback: Boolean(fallback) };
}

/** Materials for a locale: those tagged with it plus the shared ones (locale = null). */
export function resourcesForLocale<T extends { locale: Locale | null }>(resources: readonly T[], locale: Locale): T[] {
  return resources.filter((resource) => resource.locale === null || resource.locale === locale);
}
