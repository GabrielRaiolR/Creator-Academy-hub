import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { LessonGrid } from "@/components/lessons/lesson-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getLocaleContext } from "@/lib/i18n/server";
import { requireUser } from "@/lib/permissions";
import { listPublishedLessons } from "@/lib/queries/lessons";

export async function generateMetadata({ params }: PageProps<"/[locale]/aulas">): Promise<Metadata> {
  const { t } = await getLocaleContext(params);
  return { title: t.lessons.title };
}

export default async function LessonsPage({ params }: PageProps<"/[locale]/aulas">) {
  const { segment, locale, t } = await getLocaleContext(params);
  await requireUser(segment);
  const lessons = await listPublishedLessons(locale);

  return (
    <>
      <PageHeader eyebrow={t.lessons.eyebrow} title={t.lessons.title} description={t.lessons.subtitle} />
      {lessons.length === 0 ? (
        <EmptyState
          icon={<BookOpen aria-hidden className="size-5" strokeWidth={1.5} />}
          title={t.lessons.emptyTitle}
          description={t.lessons.emptyText}
        />
      ) : (
        <LessonGrid lessons={lessons} segment={segment} t={t} />
      )}
    </>
  );
}
