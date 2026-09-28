import { BookOpen, FileText, Plus, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { localePath, localeShortNames, locales } from "@/lib/i18n/config";
import { getLocaleContext } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/permissions";
import { listLessonsForAdmin } from "@/lib/queries/lessons";
import { cn, formatDate } from "@/lib/utils";
import { LessonRowActions } from "./lesson-row-actions";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/aulas">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return { title: t.admin.lessons.title };
}

export default async function AdminLessonsPage({ params }: PageProps<"/[locale]/admin/aulas">) {
  const { segment, locale, t } = await getLocaleContext(params);
  await requireAdmin(segment);
  const lessons = await listLessonsForAdmin();
  const l = t.admin.lessons;

  return (
    <>
      <PageHeader
        eyebrow={t.admin.eyebrow}
        title={l.title}
        description={l.subtitle}
        actions={
          <ButtonLink
            href={localePath(segment, "/admin/aulas/nova")}
            variant="primary"
            icon={<Plus aria-hidden className="size-4" strokeWidth={1.5} />}
          >
            {l.new}
          </ButtonLink>
        }
      />

      {lessons.length === 0 ? (
        <EmptyState
          icon={<BookOpen aria-hidden className="size-5" strokeWidth={1.5} />}
          title={l.emptyTitle}
          description={l.emptyText}
          action={
            <ButtonLink href={localePath(segment, "/admin/aulas/nova")} variant="primary">
              {l.new}
            </ButtonLink>
          }
        />
      ) : (
        <ol className="divide-y divide-zinc-100 overflow-hidden rounded-2xl bg-white shadow-ring">
          {lessons.map((lesson, index) => {
            const title = lesson.titles[locale] || Object.values(lesson.titles).find(Boolean) || l.untitled;
            return (
              <li key={lesson.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <span className="mt-0.5 w-8 shrink-0 text-sm font-semibold text-zinc-300 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={localePath(segment, `/admin/aulas/${lesson.id}`)}
                        className="font-medium tracking-tight text-zinc-900 hover:text-blue-dark"
                      >
                        {title}
                      </Link>
                      <Badge tone={lesson.status === "PUBLISHED" ? "success" : "warning"}>
                        {t.admin.lessonStatus[lesson.status]}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="truncate" lang="en">
                        /{lesson.slug}
                      </span>
                      <span className="inline-flex items-center gap-1" aria-label={l.translations}>
                        {locales.map((item) => {
                          const complete = lesson.completeLocales.includes(item);
                          return (
                            <span
                              key={item}
                              lang={item}
                              title={`${t.languages[item]}: ${complete ? t.admin.editor.complete : t.admin.editor.incomplete}`}
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                complete ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400 line-through",
                              )}
                            >
                              {localeShortNames[item]}
                            </span>
                          );
                        })}
                      </span>
                      {lesson.hasVideo ? (
                        <span className="inline-flex items-center gap-1">
                          <PlayCircle aria-hidden className="size-3.5 text-blue-primary" strokeWidth={1.5} />
                          {t.lessons.video}
                        </span>
                      ) : null}
                      {lesson.resourceCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <FileText aria-hidden className="size-3.5 text-blue-primary" strokeWidth={1.5} />
                          {t.lessons.material} ({lesson.resourceCount})
                        </span>
                      ) : null}
                      <span>
                        {l.updatedAt}: {formatDate(lesson.updatedAt, locale)}
                      </span>
                    </div>
                  </div>
                </div>
                <LessonRowActions
                  id={lesson.id}
                  slug={lesson.slug}
                  isFirst={index === 0}
                  isLast={index === lessons.length - 1}
                />
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
