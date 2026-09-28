import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { lesson } from "@/db/schema";
import { PDF_MIME_TYPE, isBlobConfigured, lessonBlobPrefix, maxUploadBytes } from "@/lib/config";
import { AccessError, assertAdmin } from "@/lib/permissions";

const payloadSchema = z.object({ lessonId: z.uuid() });

/**
 * Issues short-lived, single-purpose client tokens so the browser can upload a PDF
 * directly to the private Blob store (bypassing the serverless body-size limit).
 * The read-write token never leaves the server.
 */
function accessDenied(error: AccessError) {
  return NextResponse.json({ error: error.code }, { status: error.code === "UNAUTHORIZED" ? 401 : 403 });
}

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof AccessError) return accessDenied(error);
    throw error;
  }
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: "BLOB_NOT_CONFIGURED" }, { status: 503 });
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await assertAdmin();

        const payload = payloadSchema.safeParse(JSON.parse(clientPayload ?? "null"));
        if (!payload.success) throw new Error("INVALID_PAYLOAD");
        const { lessonId } = payload.data;

        if (!pathname.startsWith(lessonBlobPrefix(lessonId)) || !pathname.toLowerCase().endsWith(".pdf")) {
          throw new Error("INVALID_PATH");
        }
        const [owner] = await db.select({ id: lesson.id }).from(lesson).where(eq(lesson.id, lessonId)).limit(1);
        if (!owner) throw new Error("LESSON_NOT_FOUND");

        return {
          allowedContentTypes: [PDF_MIME_TYPE],
          maximumSizeInBytes: maxUploadBytes(),
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AccessError) return accessDenied(error);
    console.error("[upload]", error);
    return NextResponse.json({ error: "UPLOAD_REJECTED" }, { status: 400 });
  }
}
