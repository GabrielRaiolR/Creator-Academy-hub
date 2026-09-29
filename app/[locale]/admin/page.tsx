import { Plus, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Overline } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { localePath } from "@/lib/i18n/config";
import { getLocaleContext } from "@/lib/i18n/server";
import { pickTranslation } from "@/lib/lessons/translations";
import { requireAdmin } from "@/lib/permissions";
import { countLessonsByStatus, listRecentlyUpdatedLessons } from "@/lib/queries/lessons";
import { countActiveStudents } from "@/lib/queries/users";
import { formatDate, formatNumber } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return { title: t.admin.dashboard.title };
}

export default async function AdminDashboardPage({ params }: PageProps<"/[locale]/admin">) {
  const { segment, locale, t } = await getLocaleContext(params);
  await requireAdmin(segment);

  const [students, lessonCounts, recent] = await Promise.all([
    countActiveStudents(),
    countLessonsByStatus(),
    listRecentlyUpdatedLessons(5),
  ]);

  const stats = [
    { label: t.admin.dashboard.activeStudents, value: students, href: "/admin/alunos" },
    { label: t.admin.dashboard.publishedLessons, value: lessonCounts.PUBLISHED, href: "/admin/aulas" },
    { label: t.admin.dashboard.draftLessons, value: lessonCounts.DRAFT, href: "/admin/aulas" },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t.admin.eyebrow}
        title={t.admin.dashboard.title}
        description={t.admin.dashboard.subtitle}
        actions={
          <>
            <ButtonLink
              href={localePath(segment, "/admin/alunos/novo")}
              icon={<UserPlus aria-hidden className="size-4" strokeWidth={1.5} />}
            >
              {t.admin.dashboard.newStudent}
            </ButtonLink>
            <ButtonLink
              href={localePath(segment, "/admin/aulas/nova")}
              variant="primary"
              icon={<Plus aria-hidden className="size-4" strokeWidth={1.5} />}
            >
              {t.admin.dashboard.newLesson}
            </ButtonLink>
          </>
        }
      />

      <dl className="mb-8 grid grid-cols-1 gap-px overflow-hidden rounded-[2rem] bg-zinc-200 shadow-ring sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white">
            <Link href={localePath(segment, stat.href)} className="flex flex-col gap-3 p-6 hover:bg-zinc-50 sm:p-8">
              <dt>
                <Overline>{stat.label}</Overline>
              </dt>
              <dd className="text-4xl font-medium tracking-tighter text-zinc-900">{formatNumber(stat.value, locale)}</dd>
            </Link>
          </div>
        ))}
      </dl>

      <section aria-labelledby="recent-lessons">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="recent-lessons" className="text-xl font-semibold tracking-tight text-zinc-900">
            {t.admin.dashboard.recentTitle}
          </h2>
          <TextLink href={localePath(segment, "/admin/aulas")}>{t.admin.dashboard.viewAll}</TextLink>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title={t.admin.lessons.emptyTitle}
            description={t.admin.dashboard.noLessons}
            action={
              <ButtonLink href={localePath(segment, "/admin/aulas/nova")} variant="primary">
                {t.admin.dashboard.newLesson}
              </ButtonLink>
            }
          />
        ) : (
          <Card className="divide-y divide-zinc-100 overflow-hidden">
            {recent.map((lesson) => {
              const title = pickTranslation(lesson.translations, locale).translation?.title;
              return (
                <Link
                  key={lesson.id}
                  href={localePath(segment, `/admin/aulas/${lesson.id}`)}
                  className="flex flex-col gap-2 p-5 hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium tracking-tight text-zinc-900">
                      {title || t.admin.lessons.untitled}
                    </span>
                    <span className="block truncate text-xs text-zinc-500" lang="en">
                      /{lesson.slug}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <Badge tone={lesson.status === "PUBLISHED" ? "success" : "warning"}>
                      {t.admin.lessonStatus[lesson.status]}
                    </Badge>
                    <time dateTime={lesson.updatedAt.toISOString()} className="text-xs text-zinc-400">
                      {formatDate(lesson.updatedAt, locale)}
                    </time>
                  </span>
                </Link>
              );
            })}
          </Card>
        )}
      </section>
    </>
  );
}
