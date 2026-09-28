import { Pencil, Search, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { localePath } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { getLocaleContext } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/permissions";
import { listUsers } from "@/lib/queries/users";
import { formatDate } from "@/lib/utils";
import { ToggleActiveButton } from "./toggle-active-button";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/alunos">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return { title: t.admin.students.title };
}

export default async function StudentsPage({ params, searchParams }: PageProps<"/[locale]/admin/alunos">) {
  const { segment, locale, t } = await getLocaleContext(params);
  const admin = await requireAdmin(segment);
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const users = await listUsers({ query });

  const s = t.admin.students;

  return (
    <>
      <PageHeader
        eyebrow={t.admin.eyebrow}
        title={s.title}
        description={s.subtitle}
        actions={
          <ButtonLink
            href={localePath(segment, "/admin/alunos/novo")}
            variant="primary"
            icon={<UserPlus aria-hidden className="size-4" strokeWidth={1.5} />}
          >
            {s.new}
          </ButtonLink>
        }
      />

      <form role="search" className="mb-6 flex gap-2" action={localePath(segment, "/admin/alunos")}>
        <label htmlFor="student-search" className="sr-only">
          {t.common.search}
        </label>
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400"
            strokeWidth={1.5}
          />
          <Input
            id="student-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={s.searchPlaceholder}
            className="bg-white pl-10"
          />
        </div>
        <Button type="submit" variant="dark">
          {t.common.search}
        </Button>
        {query ? (
          <ButtonLink href={localePath(segment, "/admin/alunos")} variant="ghost">
            {t.common.clear}
          </ButtonLink>
        ) : null}
      </form>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users aria-hidden className="size-5" strokeWidth={1.5} />}
          title={s.emptyTitle}
          description={query ? format(s.emptySearchText, { query }) : s.emptyText}
          action={
            query ? null : (
              <ButtonLink href={localePath(segment, "/admin/alunos/novo")} variant="primary">
                {s.new}
              </ButtonLink>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl bg-white shadow-ring">
          <li
            aria-hidden
            className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 bg-zinc-50/80 px-5 py-3 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase lg:grid"
          >
            <span>{s.name}</span>
            <span>{s.role}</span>
            <span>{s.language}</span>
            <span>{s.status}</span>
            <span className="w-40 text-right">{t.common.actions}</span>
          </li>
          {users.map((item) => {
            const isSelf = item.id === admin.id;
            return (
              <li
                key={item.id}
                className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-4"
              >
                <div className="min-w-0">
                  <Link
                    href={localePath(segment, `/admin/alunos/${item.id}`)}
                    className="block truncate font-medium tracking-tight text-zinc-900 hover:text-blue-dark"
                  >
                    {item.name}
                    {isSelf ? <span className="ml-2 text-xs font-normal text-zinc-400">({s.you})</span> : null}
                  </Link>
                  <span className="block truncate text-sm text-zinc-500">{item.email}</span>
                  <span className="block text-xs text-zinc-400 lg:hidden">
                    {s.createdAt}: {formatDate(item.createdAt, locale)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:contents">
                  <span className="text-sm text-zinc-600">{t.admin.roles[item.role]}</span>
                  <span className="text-sm text-zinc-600" lang={item.preferredLocale}>
                    {t.languages[item.preferredLocale]}
                  </span>
                  <span>
                    <Badge tone={item.active ? "success" : "muted"}>{item.active ? s.active : s.inactive}</Badge>
                  </span>
                </div>
                <div className="flex items-center gap-2 lg:w-40 lg:justify-end">
                  <ButtonLink
                    href={localePath(segment, `/admin/alunos/${item.id}`)}
                    size="sm"
                    variant="ghost"
                    icon={<Pencil aria-hidden className="size-3.5" strokeWidth={1.5} />}
                  >
                    {t.common.edit}
                  </ButtonLink>
                  {isSelf ? null : <ToggleActiveButton id={item.id} name={item.name} active={item.active} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
