"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n/i18n-provider";
import { setPreferredLocaleAction } from "@/lib/actions/profile";
import { localeShortNames, locales, localeToSegment, switchLocaleInPath, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** PT / বাং toggle: stays on the same page and remembers the choice on the profile. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (target: Locale) => {
    if (target === locale || pending) return;
    startTransition(async () => {
      const result = await setPreferredLocaleAction(target);
      if (!result.ok) toast.error(t.errors.generic);
      const query = searchParams.toString();
      router.push(`${switchLocaleInPath(pathname, localeToSegment(target))}${query ? `?${query}` : ""}`);
    });
  };

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      aria-busy={pending || undefined}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-white/60 bg-white/50 p-1 shadow-pill backdrop-blur-sm",
        pending && "opacity-60",
        className,
      )}
    >
      {locales.map((option) => {
        const selected = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            aria-pressed={selected}
            title={t.languages[option]}
            onClick={() => change(option)}
            className={cn(
              "inline-flex h-8 min-w-10 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors",
              selected ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
            )}
          >
            {localeShortNames[option]}
          </button>
        );
      })}
    </div>
  );
}
