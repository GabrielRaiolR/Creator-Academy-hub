import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Brand } from "@/components/layout/brand";
import { Frame } from "@/components/layout/frame";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Eyebrow } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { localePath } from "@/lib/i18n/config";
import { getLocaleContext } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return { title: t.auth.title };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { segment, t } = await getLocaleContext(params);
  if (await getCurrentUser()) redirect(localePath(segment));

  const { next } = await searchParams;

  return (
    <Frame fillViewport>
      <header className="flex shrink-0 items-center justify-between gap-4 px-6 pt-4 md:px-10 md:pt-6">
        <Brand href={localePath(segment, "/login")} />
        <Suspense fallback={null}>
          <LanguageSwitcher />
        </Suspense>
      </header>

      <main id="main" className="flex min-h-0 flex-1 items-center justify-center px-6 py-4">
        <div className="w-full max-w-md">
          <div className="mb-5 text-center">
            <Eyebrow className="mb-3">{t.auth.eyebrow}</Eyebrow>
            <h1 className="text-3xl font-medium tracking-tighter text-zinc-900 sm:text-4xl">{t.auth.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:text-base">{t.auth.subtitle}</p>
          </div>
          <Card className="p-5 sm:p-6">
            <LoginForm next={typeof next === "string" ? next : undefined} />
          </Card>
          <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500">{t.auth.noAccount}</p>
        </div>
      </main>
    </Frame>
  );
}
