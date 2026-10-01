import { ArrowUpRight, FileText, PlayCircle } from "lucide-react";
import Link from "next/link";
import { LessonCarousel } from "@/components/lessons/lesson-carousel";
import { Overline } from "@/components/ui/badge";
import { localePath, type LocaleSegment } from "@/lib/i18n/config";
import { format, type Messages } from "@/lib/i18n/messages";
import type { LessonCardData } from "@/lib/queries/lessons";

const PAGE_SIZE = 3;

function pad(number: number) {
  return String(number).padStart(2, "0");
}

export function LessonFeatures({ lesson, t }: { lesson: Pick<LessonCardData, "hasVideo" | "hasMaterial">; t: Messages }) {
  if (!lesson.hasVideo && !lesson.hasMaterial) return null;
  return (
    <ul className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
      {lesson.hasVideo ? (
        <li className="inline-flex items-center gap-1.5">
          <PlayCircle aria-hidden className="size-4 text-blue-primary" strokeWidth={1.5} />
          {t.lessons.video}
        </li>
      ) : null}
      {lesson.hasMaterial ? (
        <li className="inline-flex items-center gap-1.5">
          <FileText aria-hidden className="size-4 text-blue-primary" strokeWidth={1.5} />
          {t.lessons.material}
        </li>
      ) : null}
    </ul>
  );
}

function LessonCard({ lesson, segment, t }: { lesson: LessonCardData; segment: LocaleSegment; t: Messages }) {
  return (
    <Link
      href={localePath(segment, `/aulas/${lesson.slug}`)}
      draggable={false}
      className="group flex h-full min-w-0 w-full flex-col gap-4 p-6 transition-colors hover:bg-zinc-50/80 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <Overline>{format(t.lessons.lessonNumber, { number: pad(lesson.number) })}</Overline>
        <ArrowUpRight
          aria-hidden
          className="size-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-900"
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-balance text-zinc-900">
        {lesson.title || t.lessons.untitled}
      </h3>
      {lesson.summary ? <p className="line-clamp-3 text-sm leading-relaxed text-zinc-500">{lesson.summary}</p> : null}
      <div className="mt-auto pt-2">
        <LessonFeatures lesson={lesson} t={t} />
      </div>
    </Link>
  );
}

/** Design system "feature grid": hairline-separated white cells inside one rounded container. */
export function LessonGrid({ lessons, segment, t }: { lessons: LessonCardData[]; segment: LocaleSegment; t: Messages }) {
  const paged = lessons.length > PAGE_SIZE;
  const cards = lessons.map((lesson) => (
    <li key={lesson.id} className="flex min-w-0 bg-white">
      <LessonCard lesson={lesson} segment={segment} t={t} />
    </li>
  ));

  if (!paged) {
    return (
      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-[2rem] bg-zinc-200 shadow-ring md:grid-cols-2 lg:grid-cols-3">
        {cards}
      </ul>
    );
  }

  return (
    <LessonCarousel
      pageSize={PAGE_SIZE}
      previousLabel={t.lessons.previousPage}
      nextLabel={t.lessons.nextPage}
      pageLabel={t.lessons.pageStatus}
    >
      {cards}
    </LessonCarousel>
  );
}
