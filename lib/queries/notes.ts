import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessonNote } from "@/db/schema";
import type { StoredNote } from "@/lib/content/note-anchor";
import type { Locale } from "@/lib/i18n/config";

/** Notes the current reader attached to this lesson in the language actually on screen. */
export async function listLessonNotes(lessonId: string, locale: Locale, userId: string): Promise<StoredNote[]> {
  return db
    .select({
      id: lessonNote.id,
      quote: lessonNote.quote,
      prefix: lessonNote.prefix,
      suffix: lessonNote.suffix,
      position: lessonNote.position,
      body: lessonNote.body,
    })
    .from(lessonNote)
    .where(and(eq(lessonNote.lessonId, lessonId), eq(lessonNote.locale, locale), eq(lessonNote.userId, userId)))
    .orderBy(asc(lessonNote.createdAt));
}
