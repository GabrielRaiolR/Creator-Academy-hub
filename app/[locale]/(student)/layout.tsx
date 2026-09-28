import { AppShell } from "@/components/layout/app-shell";
import { localePath } from "@/lib/i18n/config";
import { getLocaleContext } from "@/lib/i18n/server";
import { isAdmin, requireUser } from "@/lib/permissions";

export default async function StudentLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { segment, t } = await getLocaleContext(params);
  const user = await requireUser(segment);

  const nav = [
    { href: localePath(segment), label: t.nav.home, exact: true },
    { href: localePath(segment, "/aulas"), label: t.nav.lessons },
    { href: localePath(segment, "/perfil"), label: t.nav.profile },
    ...(isAdmin(user) ? [{ href: localePath(segment, "/admin"), label: t.nav.admin }] : []),
  ];

  return (
    <AppShell user={user} homeHref={localePath(segment)} nav={nav} t={t}>
      {children}
    </AppShell>
  );
}
