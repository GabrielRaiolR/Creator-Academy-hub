import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { lesson, lessonResource } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { attachmentDisposition } from "@/lib/blob";
import { PDF_MIME_TYPE, isBlobConfigured } from "@/lib/config";
import { defaultSegment, isLocaleSegment, LOCALE_COOKIE, localePath } from "@/lib/i18n/config";
import { canViewLesson } from "@/lib/permissions/rules";
import { idSchema } from "@/lib/validations";

const noStore = { "Cache-Control": "private, no-store" };

function unavailable(status: number) {
  return new NextResponse(null, { status, headers: noStore });
}

/**
 * Streams a private lesson PDF after checking: session → active user → resource exists →
 * the lesson is visible to this user. The Blob URL and token are never exposed.
 */
export async function GET(request: Request, context: RouteContext<"/api/resources/[id]/download">) {
  const user = await getCurrentUser();
  if (!user) {
    const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
    const segment = isLocaleSegment(cookie) ? cookie : defaultSegment;
    return NextResponse.redirect(new URL(localePath(segment, "/login"), request.url));
  }

  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return unavailable(404);

  const [resource] = await db
    .select({
      name: lessonResource.name,
      blobPath: lessonResource.blobPath,
      size: lessonResource.size,
      status: lesson.status,
    })
    .from(lessonResource)
    .innerJoin(lesson, eq(lesson.id, lessonResource.lessonId))
    .where(eq(lessonResource.id, parsedId.data))
    .limit(1);

  if (!resource || !canViewLesson(user, resource)) return unavailable(404);
  if (!isBlobConfigured()) return unavailable(503);

  const blob = await get(resource.blobPath, { access: "private" }).catch((error: unknown) => {
    console.error("[download]", error);
    return null;
  });
  if (!blob || blob.statusCode !== 200) return unavailable(404);

  return new NextResponse(blob.stream, {
    headers: {
      ...noStore,
      "Content-Type": PDF_MIME_TYPE,
      "Content-Length": String(blob.blob.size),
      "Content-Disposition": attachmentDisposition(resource.name),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
