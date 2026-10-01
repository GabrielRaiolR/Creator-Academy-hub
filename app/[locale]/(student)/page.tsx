import { BookOpen } from "lucide-react";
import Link from "next/link";
import { LessonFeatures, LessonGrid } from "@/components/lessons/lesson-grid";
import { Overline } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { localePath } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { getLocaleContext } from "@/lib/i18n/server";
import { requireUser } from "@/lib/permissions";
import { listPublishedLessons } from "@/lib/queries/lessons";
import { formatDate } from "@/lib/utils";

const PREVIEW_COUNT = 6;
const RECENT_COUNT = 3;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { segment, locale, t } = await getLocaleContext(params);
  const user = await requireUser(segment);
  const lessons = await listPublishedLessons(locale, user);

  const recent = lessons
    .filter((lesson) => lesson.publishedAt)
    .toSorted((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, RECENT_COUNT);

  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <>
      <PageHeader
        eyebrow={t.home.eyebrow}
        title={format(t.home.greeting, { name: firstName })}
        description={t.home.subtitle}
      />

      {lessons.length === 0 ? (
        <EmptyState
          icon={<BookOpen aria-hidden className="size-5" strokeWidth={1.5} />}
          title={t.home.emptyTitle}
          description={t.home.emptyText}
        />
      ) : (
        <div className="flex flex-col gap-10">
          <section aria-labelledby="available-title">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 id="available-title" className="text-2xl font-medium tracking-tight text-zinc-900">
                {t.home.availableLessons}
              </h2>
              {lessons.length > PREVIEW_COUNT ? (
                <TextLink href={localePath(segment, "/aulas")}>{t.home.viewAllLessons}</TextLink>
              ) : null}
            </div>
            <LessonGrid lessons={lessons.slice(0, PREVIEW_COUNT)} segment={segment} t={t} />
          </section>

          {recent.length > 0 ? (
            <section aria-labelledby="recent-title">
              <h2 id="recent-title" className="text-2xl font-medium tracking-tight text-zinc-900">
                {t.home.recentTitle}
              </h2>
              <p className="mt-1 mb-6 text-sm text-zinc-500">{t.home.recentSubtitle}</p>
              <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl bg-white shadow-ring">
                {recent.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={localePath(segment, `/aulas/${lesson.slug}`)}
                      className="flex flex-col gap-2 p-5 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="min-w-0">
                        <Overline>{format(t.lessons.lessonNumber, { number: String(lesson.number).padStart(2, "0") })}</Overline>
                        <span className="mt-1 block font-medium tracking-tight text-zinc-900">
                          {lesson.title || t.lessons.untitled}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-4">
                        <LessonFeatures lesson={lesson} t={t} />
                        {lesson.publishedAt ? (
                          <time dateTime={lesson.publishedAt.toISOString()} className="text-xs text-zinc-400">
                            {formatDate(lesson.publishedAt, locale)}
                          </time>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
