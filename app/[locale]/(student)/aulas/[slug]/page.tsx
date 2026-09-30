import { Eye, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AnnotatedLesson } from "@/components/lessons/annotated-lesson";
import { MaterialsList } from "@/components/lessons/materials-list";
import { VideoPlayer } from "@/components/lessons/video-player";
import { Badge, Overline } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
import { getCurrentUser } from "@/lib/auth/session";
import { isValidSlug } from "@/lib/slug";
import { localePath, type Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { getLocaleContext } from "@/lib/i18n/server";
import { isAdmin, requireUser } from "@/lib/permissions";
import { getLessonForReader } from "@/lib/queries/lessons";
import { listLessonNotes } from "@/lib/queries/notes";

const loadLesson = cache(async (slug: string, locale: Locale) => {
  const user = await getCurrentUser();
  if (!user || !isValidSlug(slug)) return null;
  return getLessonForReader(slug, locale, user);
});

export async function generateMetadata({ params }: PageProps<"/[locale]/aulas/[slug]">): Promise<Metadata> {
  const { locale, t } = await getLocaleContext(params);
  const { slug } = await params;
  const lesson = await loadLesson(slug, locale);
  return { title: lesson?.translation?.title || t.lessons.title };
}

export default async function LessonPage({ params }: PageProps<"/[locale]/aulas/[slug]">) {
  const { segment, locale, t } = await getLocaleContext(params);
  const user = await requireUser(segment);
  const { slug } = await params;
  const lesson = await loadLesson(slug, locale);
  if (!lesson) notFound();

  const translation = lesson.translation;
  const title = translation?.title || t.lessons.untitled;
  const contentLocale = (translation?.locale ?? locale) as Locale;
  const admin = isAdmin(user);
  const notes = translation ? await listLessonNotes(lesson.id, contentLocale, user.id) : [];

  return (
    <article className="mx-auto max-w-3xl">
      <div className="rounded-4xl border border-zinc-200/80 bg-white/95 p-6 shadow-ring backdrop-blur-md sm:p-8 md:p-10">
      <TextLink href={localePath(segment, "/aulas")} direction="back" className="mb-8">
        {t.lessons.backToLessons}
      </TextLink>

      {lesson.status === "DRAFT" ? (
        <div
          role="status"
          className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-start gap-2">
            <Eye aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
            {t.lessons.draftBanner}
          </span>
          {admin ? (
            <ButtonLink
              href={localePath(segment, `/admin/aulas/${lesson.id}`)}
              size="sm"
              variant="dark"
              icon={<Pencil aria-hidden className="size-3.5" strokeWidth={1.5} />}
            >
              {t.lessons.editLesson}
            </ButtonLink>
          ) : null}
        </div>
      ) : null}

      {lesson.isFallback && translation ? (
        <p role="note" className="mb-8 rounded-2xl bg-zinc-50 p-4 text-center text-sm leading-relaxed text-zinc-600 shadow-ring">
          {format(t.lessons.fallbackNotice, {
            language: t.languages[locale],
            fallback: t.languages[translation.locale as Locale] ?? translation.locale,
          })}
        </p>
      ) : null}

      <header className="mb-10" lang={contentLocale}>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {lesson.number ? (
            <Overline>{format(t.lessons.lessonNumber, { number: String(lesson.number).padStart(2, "0") })}</Overline>
          ) : null}
          {lesson.status === "DRAFT" ? <Badge tone="warning">{t.admin.lessonStatus.DRAFT}</Badge> : null}
        </div>
        <h1 className="text-3xl font-medium tracking-tighter text-balance text-zinc-900 md:text-5xl">{title}</h1>
        {translation?.summary ? (
          <p className="mt-5 text-lg leading-relaxed text-zinc-500">{translation.summary}</p>
        ) : null}
      </header>

      {lesson.videoId ? (
        <div className="mb-12">
          <VideoPlayer videoId={lesson.videoId} title={format(t.lessons.videoTitle, { title })} />
        </div>
      ) : null}

      {translation ? (
        <AnnotatedLesson
          content={translation.content}
          lang={contentLocale}
          lessonId={lesson.id}
          locale={contentLocale}
          notes={notes}
        />
      ) : null}

      {lesson.resources.length > 0 ? (
        <section aria-labelledby="materials-title" className="mt-14">
          <h2 id="materials-title" className="text-xl font-semibold tracking-tight text-zinc-900">
            {t.lessons.materialsTitle}
          </h2>
          <p className="mt-1 mb-5 text-sm text-zinc-500">{t.lessons.materialsSubtitle}</p>
          <MaterialsList materials={lesson.resources} locale={locale} t={t} />
        </section>
      ) : null}
      </div>

      {lesson.previousSlug || lesson.nextSlug ? (
        <nav
          aria-label={t.lessons.title}
          className="mt-8 flex flex-col gap-4 border-t border-zinc-950/10 pt-8 sm:flex-row sm:justify-between"
        >
          {lesson.previousSlug ? (
            <TextLink href={localePath(segment, `/aulas/${lesson.previousSlug}`)} direction="back">
              {t.lessons.previous}
            </TextLink>
          ) : (
            <span />
          )}
          {lesson.nextSlug ? (
            <TextLink href={localePath(segment, `/aulas/${lesson.nextSlug}`)}>{t.lessons.next}</TextLink>
          ) : null}
        </nav>
      ) : null}
    </article>
  );
}
