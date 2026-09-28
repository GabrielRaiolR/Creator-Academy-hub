"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale, LocaleSegment } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

type I18nValue = {
  locale: Locale;
  segment: LocaleSegment;
  t: Messages;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ value, children }: { value: I18nValue; children: ReactNode }) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
