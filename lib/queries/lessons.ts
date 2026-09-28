import "server-only";
import { and, asc, count, desc, eq, inArray, max } from "drizzle-orm";
import { db } from "@/db";
import { lesson, lessonGrant, user, type LessonStatus } from "@/db/schema";
import { isRichTextEmpty } from "@/lib/content/rich-text";
import { locales, type Locale } from "@/lib/i18n/config";
import { pickTranslation, resourcesForLocale } from "@/lib/lessons/translations";
import { canViewLesson, type CurrentUser } from "@/lib/permissions/rules";
import { parseYouTubeId } from "@/lib/youtube";

const publishedOrder = [asc(lesson.order), asc(lesson.createdAt)];

export type LessonCardData = {
  id: string;
  slug: string;
  number: number;
  title: string;
  summary: string | null;
  hasVideo: boolean;
  hasMaterial: boolean;
  publishedAt: Date | null;
};

/** Lesson ids released to this student. Admins are not filtered. */
export async function grantedLessonIds(viewer: CurrentUser): Promise<string[] | null> {
  if (viewer.role === "ADMIN") return null;
  const rows = await db
    .select({ lessonId: lessonGrant.lessonId })
    .from(lessonGrant)
    .where(eq(lessonGrant.userId, viewer.id));
  return rows.map((row) => row.lessonId);
}

export async function studentHasGrant(userId: string, lessonId: string): Promise<boolean> {
  const [row] = await db
    .select({ lessonId: lessonGrant.lessonId })
    .from(lessonGrant)
    .where(and(eq(lessonGrant.userId, userId), eq(lessonGrant.lessonId, lessonId)))
    .limit(1);
  return Boolean(row);
}

/** Published lessons this person may see. Students only receive lessons released to them. */
export async function listPublishedLessons(locale: Locale, viewer: CurrentUser): Promise<LessonCardData[]> {
  const granted = await grantedLessonIds(viewer);
  if (granted && granted.length === 0) return [];

  const rows = await db.query.lesson.findMany({
    where: granted ? and(eq(lesson.status, "PUBLISHED"), inArray(lesson.id, granted)) : eq(lesson.status, "PUBLISHED"),
    orderBy: publishedOrder,
    columns: { id: true, slug: true, youtubeUrl: true, publishedAt: true },
    with: {
      translations: { columns: { locale: true, title: true, summary: true } },
      resources: { columns: { id: true, locale: true } },
    },
  });

  return rows.map((row, index) => {
    const { translation } = pickTranslation(row.translations, locale);
    return {
      id: row.id,
      slug: row.slug,
      number: index + 1,
      title: translation?.title ?? "",
      summary: translation?.summary || null,
      hasVideo: Boolean(row.youtubeUrl),
      hasMaterial: resourcesForLocale(row.resources, locale).length > 0,
      publishedAt: row.publishedAt,
    };
  });
}

export type ReaderLesson = NonNullable<Awaited<ReturnType<typeof getLessonForReader>>>;

/** Loads a lesson for the reading page, enforcing visibility for the current user. */
export async function getLessonForReader(slug: string, locale: Locale, viewer: CurrentUser) {
  const row = await db.query.lesson.findFirst({
    where: eq(lesson.slug, slug),
    with: {
      translations: true,
      resources: { orderBy: (resource, { asc: ascending }) => [ascending(resource.createdAt)] },
    },
  });
  if (!row) return null;
  const granted = viewer.role === "ADMIN" || (await studentHasGrant(viewer.id, row.id));
  if (!canViewLesson(viewer, row, granted)) return null;

  const { translation, isFallback } = pickTranslation(row.translations, locale);
  const allowed = await grantedLessonIds(viewer);
  const published =
    allowed && allowed.length === 0
      ? []
      : await db
          .select({ id: lesson.id, slug: lesson.slug })
          .from(lesson)
          .where(allowed ? and(eq(lesson.status, "PUBLISHED"), inArray(lesson.id, allowed)) : eq(lesson.status, "PUBLISHED"))
          .orderBy(...publishedOrder);

  const position = published.findIndex((item) => item.id === row.id);
  const neighbour = (offset: number) => (position === -1 ? null : published[position + offset] ?? null);

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    number: position === -1 ? null : position + 1,
    videoId: row.youtubeUrl ? parseYouTubeId(row.youtubeUrl) : null,
    translation: translation ?? null,
    isFallback,
    resources: resourcesForLocale(row.resources, locale).map((resource) => ({
      id: resource.id,
      name: resource.name,
      size: resource.size,
      locale: resource.locale,
    })),
    previousSlug: neighbour(-1)?.slug ?? null,
    nextSlug: neighbour(1)?.slug ?? null,
  };
}

export type AdminLessonRow = Awaited<ReturnType<typeof listLessonsForAdmin>>[number];

export async function listLessonsForAdmin() {
  const rows = await db.query.lesson.findMany({
    orderBy: publishedOrder,
    with: {
      translations: { columns: { locale: true, title: true, content: true } },
      resources: { columns: { id: true } },
      grants: { with: { user: { columns: { id: true, name: true, email: true } } } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    order: row.order,
    status: row.status,
    updatedAt: row.updatedAt,
    hasVideo: Boolean(row.youtubeUrl),
    resourceCount: row.resources.length,
    grants: row.grants
      .map((grant) => grant.user)
      .filter((person): person is { id: string; name: string; email: string } => person !== null),
    titles: Object.fromEntries(row.translations.map((item) => [item.locale, item.title])) as Partial<Record<Locale, string>>,
    completeLocales: locales.filter((locale) => {
      const item = row.translations.find((translation) => translation.locale === locale);
      return Boolean(item?.title.trim()) && !isRichTextEmpty(item?.content);
    }),
  }));
}

export async function getLessonForEditor(id: string) {
  const row = await db.query.lesson.findFirst({
    where: eq(lesson.id, id),
    with: {
      translations: true,
      resources: { orderBy: (resource, { asc: ascending }) => [ascending(resource.createdAt)] },
    },
  });
  return row ?? null;
}

export async function listStudentsForRelease() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      preferredLocale: user.preferredLocale,
    })
    .from(user)
    .where(and(eq(user.role, "STUDENT"), eq(user.active, true)))
    .orderBy(asc(user.name));
}

export async function getNextLessonOrder(): Promise<number> {
  const [row] = await db.select({ value: max(lesson.order) }).from(lesson);
  return (row?.value ?? 0) + 1;
}

export async function countLessonsByStatus(): Promise<Record<LessonStatus, number>> {
  const rows = await db.select({ status: lesson.status, value: count() }).from(lesson).groupBy(lesson.status);
  return {
    DRAFT: rows.find((row) => row.status === "DRAFT")?.value ?? 0,
    PUBLISHED: rows.find((row) => row.status === "PUBLISHED")?.value ?? 0,
  };
}

export async function listRecentlyUpdatedLessons(limit = 5) {
  const rows = await db.query.lesson.findMany({
    orderBy: [desc(lesson.updatedAt)],
    limit,
    columns: { id: true, slug: true, status: true, updatedAt: true },
    with: { translations: { columns: { locale: true, title: true } } },
  });
  return rows;
}
