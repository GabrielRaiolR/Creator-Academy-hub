import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { Toaster } from "@/components/ui/toaster";
import { inter, notoSansBengali } from "@/lib/fonts";
import { getLocaleContext } from "@/lib/i18n/server";
import "../globals.css";

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return {
    title: { default: t.meta.appName, template: `%s · ${t.meta.appName}` },
    description: t.meta.description,
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#71717a",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale, segment, t } = await getLocaleContext(params);

  return (
    <html lang={locale} className={`${inter.variable} ${notoSansBengali.variable}`}>
      <body className="min-h-dvh font-sans">
        <I18nProvider value={{ locale, segment, t }}>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
