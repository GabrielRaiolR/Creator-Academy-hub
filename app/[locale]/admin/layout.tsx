import { AppShell } from "@/components/layout/app-shell";
import { localePath } from "@/lib/i18n/config";
import { getLocaleContext } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/permissions";

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { segment, t } = await getLocaleContext(params);
  const user = await requireAdmin(segment);

  const nav = [
    { href: localePath(segment, "/admin"), label: t.nav.dashboard, exact: true },
    { href: localePath(segment, "/admin/aulas"), label: t.nav.lessons },
    { href: localePath(segment, "/admin/alunos"), label: t.nav.students },
    { href: localePath(segment), label: t.nav.studentArea, exact: true },
  ];

  return (
    <AppShell user={user} homeHref={localePath(segment, "/admin")} nav={nav} t={t}>
      {children}
    </AppShell>
  );
}
