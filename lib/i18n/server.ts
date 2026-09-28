import "server-only";
import { notFound } from "next/navigation";
import { isLocaleSegment, segmentToLocale, type Locale, type LocaleSegment } from "./config";
import type { Messages } from "./messages";

const loaders: Record<Locale, () => Promise<Messages>> = {
  "pt-BR": () => import("@/messages/pt-BR.json").then((module) => module.default),
  "bn-BD": () => import("@/messages/bn-BD.json").then((module) => module.default),
};

export function getMessages(locale: Locale): Promise<Messages> {
  return loaders[locale]();
}

export type LocaleContext = {
  segment: LocaleSegment;
  locale: Locale;
  t: Messages;
};

/** Validates the `[locale]` route param and loads the matching dictionary. */
export async function getLocaleContext(params: Promise<{ locale: string }>): Promise<LocaleContext> {
  const { locale: segment } = await params;
  if (!isLocaleSegment(segment)) notFound();
  const locale = segmentToLocale(segment);
  return { segment, locale, t: await getMessages(locale) };
}
