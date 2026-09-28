"use server";

import { del, head } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lesson, lessonResource } from "@/db/schema";
import { hasPdfSignature } from "@/lib/blob";
import { PDF_MIME_TYPE, isBlobConfigured, lessonBlobPrefix, maxUploadBytes } from "@/lib/config";
import type { Locale } from "@/lib/i18n/config";
import { assertAdmin } from "@/lib/permissions";
import { idSchema, resourceInputSchema } from "@/lib/validations";
import { fail, ok, runAction, type ActionResult } from "./result";

async function discard(pathname: string) {
  await del(pathname).catch((error: unknown) => console.error("[blob] cleanup failed", error));
}

/**
 * Registers a PDF the browser uploaded straight to the private Blob store.
 * The upload token only allowed PDFs under this lesson's prefix, but we re-check everything
 * against the stored object (type, size, magic bytes) before trusting it.
 */
export async function registerResourceAction(input: {
  lessonId: string;
  locale: Locale | null;
  name: string;
  pathname: string;
}): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await assertAdmin();
    if (!isBlobConfigured()) return fail("admin.resources.notConfigured");

    const parsed = resourceInputSchema.safeParse(input);
    if (!parsed.success) return fail("admin.resources.failed");
    const { lessonId, locale, pathname } = parsed.data;

    if (!pathname.startsWith(lessonBlobPrefix(lessonId)) || !pathname.toLowerCase().endsWith(".pdf")) {
      return fail("admin.resources.invalidType");
    }

    const [owner] = await db.select({ id: lesson.id }).from(lesson).where(eq(lesson.id, lessonId)).limit(1);
    if (!owner) {
      await discard(pathname);
      return fail("errors.notFound");
    }

    const blob = await head(pathname).catch(() => null);
    if (!blob) return fail("admin.resources.failed");
    if (blob.contentType !== PDF_MIME_TYPE || !(await hasPdfSignature(pathname))) {
      await discard(pathname);
      return fail("admin.resources.invalidType");
    }
    if (blob.size > maxUploadBytes()) {
      await discard(pathname);
      return fail("admin.resources.tooLarge");
    }

    const name = parsed.data.name.toLowerCase().endsWith(".pdf") ? parsed.data.name : `${parsed.data.name}.pdf`;
    const [created] = await db
      .insert(lessonResource)
      .values({ lessonId, locale, name, blobPath: blob.pathname, mimeType: PDF_MIME_TYPE, size: blob.size })
      .returning({ id: lessonResource.id });

    revalidatePath("/", "layout");
    return ok({ id: created.id });
  });
}

export async function deleteResourceAction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) return fail("errors.notFound");

    const [deleted] = await db
      .delete(lessonResource)
      .where(eq(lessonResource.id, parsedId.data))
      .returning({ blobPath: lessonResource.blobPath });
    if (!deleted) return fail("errors.notFound");

    if (isBlobConfigured()) await discard(deleted.blobPath);
    revalidatePath("/", "layout");
    return ok();
  });
}
