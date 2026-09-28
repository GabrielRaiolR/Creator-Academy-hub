"use server";

import { del } from "@vercel/blob";
import { and, asc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lesson, lessonResource, lessonTranslation, type LessonStatus } from "@/db/schema";
import { isBlobConfigured } from "@/lib/config";
import { isRichTextEmpty, sanitizeRichText, type RichTextDoc } from "@/lib/content/rich-text";
import { locales, type Locale } from "@/lib/i18n/config";
import { getPublishIssues } from "@/lib/lessons/publish";
import { assertAdmin } from "@/lib/permissions";
import { idSchema, lessonInputSchema, type LessonInput } from "@/lib/validations";
import { canonicalYouTubeUrl, parseYouTubeId } from "@/lib/youtube";
import { fail, fromZodError, ok, runAction, type ActionResult } from "./result";

type CleanTranslation = { title: string; summary: string; content: RichTextDoc };

function isBlank(translation: CleanTranslation): boolean {
  return !translation.title && !translation.summary && isRichTextEmpty(translation.content);
}

/**
 * Saves the lesson and both translations in one transaction.
 * - intent "publish": validates completeness first; nothing is written if it fails.
 * - intent "save" on a published lesson: also validated, so a live lesson never becomes incomplete.
 */
export async function saveLessonAction(
  input: LessonInput,
): Promise<ActionResult<{ id: string; status: LessonStatus }>> {
  return runAction(async () => {
    const admin = await assertAdmin();
    const parsed = lessonInputSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const data = parsed.data;

    const translations = {} as Record<Locale, CleanTranslation>;
    for (const locale of locales) {
      const source = data.translations[locale];
      const content = sanitizeRichText(source.content);
      if (!content) return fail("errors.form", { fieldErrors: { [`translations.${locale}.content`]: "validation.invalid" } });
      translations[locale] = { title: source.title, summary: source.summary, content };
    }

    const existing = data.id
      ? (await db.select().from(lesson).where(eq(lesson.id, data.id)).limit(1))[0]
      : undefined;
    if (data.id && !existing) return fail("errors.notFound");

    const nextStatus: LessonStatus =
      data.intent === "publish" ? "PUBLISHED" : data.intent === "unpublish" ? "DRAFT" : (existing?.status ?? "DRAFT");

    if (nextStatus === "PUBLISHED") {
      const issues = getPublishIssues({ slug: data.slug, translations });
      if (issues.length) return fail("admin.editor.publishBlockedTitle", { issues });
    }

    const [slugOwner] = await db
      .select({ id: lesson.id })
      .from(lesson)
      .where(data.id ? and(eq(lesson.slug, data.slug), ne(lesson.id, data.id)) : eq(lesson.slug, data.slug))
      .limit(1);
    if (slugOwner) return fail("admin.editor.slugTaken", { fieldErrors: { slug: "admin.editor.slugTaken" } });

    const videoId = data.youtubeUrl ? parseYouTubeId(data.youtubeUrl) : null;
    const lessonValues = {
      slug: data.slug,
      order: data.order,
      status: nextStatus,
      youtubeUrl: videoId ? canonicalYouTubeUrl(videoId) : null,
      publishedAt: nextStatus === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt ?? null,
    };

    const id = await db.transaction(async (tx) => {
      let lessonId = existing?.id;
      if (lessonId) {
        await tx.update(lesson).set(lessonValues).where(eq(lesson.id, lessonId));
      } else {
        const [created] = await tx
          .insert(lesson)
          .values({ ...lessonValues, createdBy: admin.id })
          .returning({ id: lesson.id });
        lessonId = created.id;
      }

      for (const locale of locales) {
        const translation = translations[locale];
        const scope = and(eq(lessonTranslation.lessonId, lessonId), eq(lessonTranslation.locale, locale));
        if (isBlank(translation)) {
          await tx.delete(lessonTranslation).where(scope);
          continue;
        }
        const values = {
          title: translation.title,
          summary: translation.summary || null,
          content: translation.content,
        };
        await tx
          .insert(lessonTranslation)
          .values({ lessonId, locale, ...values })
          .onConflictDoUpdate({ target: [lessonTranslation.lessonId, lessonTranslation.locale], set: values });
      }
      return lessonId;
    });

    revalidatePath("/", "layout");
    return ok({ id, status: nextStatus });
  });
}

export async function deleteLessonAction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) return fail("errors.notFound");

    const resources = await db
      .select({ blobPath: lessonResource.blobPath })
      .from(lessonResource)
      .where(eq(lessonResource.lessonId, parsedId.data));

    const deleted = await db.delete(lesson).where(eq(lesson.id, parsedId.data)).returning({ id: lesson.id });
    if (deleted.length === 0) return fail("errors.notFound");

    if (resources.length && isBlobConfigured()) {
      await del(resources.map((resource) => resource.blobPath)).catch((error: unknown) => {
        console.error("[blob] failed to delete lesson files", error);
      });
    }

    revalidatePath("/", "layout");
    return ok();
  });
}

/** Swaps a lesson with its neighbour and renumbers the list 1..n so the order stays consistent. */
export async function moveLessonAction(id: string, direction: "up" | "down"): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success || (direction !== "up" && direction !== "down")) return fail("validation.invalid");

    await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: lesson.id, order: lesson.order })
        .from(lesson)
        .orderBy(asc(lesson.order), asc(lesson.createdAt));

      const index = rows.findIndex((row) => row.id === parsedId.data);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || target < 0 || target >= rows.length) return;

      [rows[index], rows[target]] = [rows[target], rows[index]];
      for (const [position, row] of rows.entries()) {
        if (row.order !== position + 1) {
          await tx.update(lesson).set({ order: position + 1 }).where(eq(lesson.id, row.id));
        }
      }
    });

    revalidatePath("/", "layout");
    return ok();
  });
}