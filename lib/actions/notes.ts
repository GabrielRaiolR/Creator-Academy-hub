"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lesson, lessonNote } from "@/db/schema";
import { flattenRichText, locateQuote, NOTE_CONTEXT, type StoredNote } from "@/lib/content/note-anchor";
import { sanitizeRichText } from "@/lib/content/rich-text";
import { segments, type Locale } from "@/lib/i18n/config";
import { assertUser } from "@/lib/permissions";
import { canViewLesson } from "@/lib/permissions/rules";
import { studentHasGrant } from "@/lib/queries/lessons";
import { idSchema, lessonNoteDraftSchema, lessonNoteUpdateSchema } from "@/lib/validations";
import { fail, fromZodError, ok, runAction, type ActionResult } from "./result";

async function readableLesson(lessonId: string) {
  const current = await assertUser();
  const row = await db.query.lesson.findFirst({
    where: eq(lesson.id, lessonId),
    columns: { id: true, status: true },
    with: { translations: { columns: { locale: true, content: true } } },
  });
  if (!row) return null;
  const granted = current.role === "ADMIN" || (await studentHasGrant(current.id, row.id));
  if (!canViewLesson(current, row, granted)) return null;
  return { current, row };
}

/** Only the lesson pages change when a note is saved. A layout-wide refresh reloads the whole app. */
async function revalidateLesson(lessonId: string) {
  const [row] = await db.select({ slug: lesson.slug }).from(lesson).where(eq(lesson.id, lessonId)).limit(1);
  if (!row) return;
  for (const segment of segments) revalidatePath(`/${segment}/aulas/${row.slug}`);
}

function contextAround(text: string, start: number, end: number) {
  return {
    quote: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - NOTE_CONTEXT), start),
    suffix: text.slice(end, end + NOTE_CONTEXT),
    position: start,
  };
}

export async function createLessonNoteAction(input: {
  lessonId: string;
  locale: Locale;
  quote: string;
  prefix: string;
  suffix: string;
  position: number;
  body: string;
}): Promise<ActionResult<StoredNote>> {
  return runAction(async () => {
    const parsed = lessonNoteDraftSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    const readable = await readableLesson(parsed.data.lessonId);
    if (!readable) return fail("errors.forbidden");

    const translation = readable.row.translations.find((item) => item.locale === parsed.data.locale);
    const doc = sanitizeRichText(translation?.content);
    const text = doc ? flattenRichText(doc) : "";
    const range = locateQuote(text, parsed.data);
    if (!range) return fail("validation.invalid", { fieldErrors: { quote: "validation.invalid" } });

    const anchor = contextAround(text, range.start, range.end);
    const [created] = await db
      .insert(lessonNote)
      .values({
        userId: readable.current.id,
        lessonId: parsed.data.lessonId,
        locale: parsed.data.locale,
        body: parsed.data.body,
        ...anchor,
      })
      .returning({
        id: lessonNote.id,
        quote: lessonNote.quote,
        prefix: lessonNote.prefix,
        suffix: lessonNote.suffix,
        position: lessonNote.position,
        body: lessonNote.body,
      });
    if (!created) return fail("errors.generic");

    await revalidateLesson(parsed.data.lessonId);
    return ok(created);
  });
}

export async function updateLessonNoteAction(input: { id: string; body: string }): Promise<ActionResult> {
  return runAction(async () => {
    const parsed = lessonNoteUpdateSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    const current = await assertUser();
    const [note] = await db
      .select()
      .from(lessonNote)
      .where(and(eq(lessonNote.id, parsed.data.id), eq(lessonNote.userId, current.id)))
      .limit(1);
    if (!note) return fail("errors.notFound");

    const readable = await readableLesson(note.lessonId);
    if (!readable) return fail("errors.forbidden");

    await db.update(lessonNote).set({ body: parsed.data.body }).where(eq(lessonNote.id, note.id));
    await revalidateLesson(note.lessonId);
    return ok();
  });
}

export async function deleteLessonNoteAction(input: { id: string }): Promise<ActionResult> {
  return runAction(async () => {
    const parsed = idSchema.safeParse(input.id);
    if (!parsed.success) return fromZodError(parsed.error);

    const current = await assertUser();
    const [note] = await db
      .select({ id: lessonNote.id, lessonId: lessonNote.lessonId })
      .from(lessonNote)
      .where(and(eq(lessonNote.id, parsed.data), eq(lessonNote.userId, current.id)))
      .limit(1);
    if (!note) return fail("errors.notFound");

    const readable = await readableLesson(note.lessonId);
    if (!readable) return fail("errors.forbidden");

    await db.delete(lessonNote).where(eq(lessonNote.id, note.id));
    await revalidateLesson(note.lessonId);
    return ok();
  });
}
