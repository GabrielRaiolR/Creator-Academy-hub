"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lesson, lessonGrant, user } from "@/db/schema";
import { assertAdmin } from "@/lib/permissions";
import { idSchema } from "@/lib/validations";
import { fail, ok, runAction, type ActionResult } from "./result";

async function studentAndLesson(lessonId: string, userId: string) {
  if (!idSchema.safeParse(lessonId).success || userId.length < 1 || userId.length > 100) return null;
  const [student] = await db
    .select({ id: user.id, role: user.role, active: user.active })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const [target] = await db.select({ id: lesson.id }).from(lesson).where(eq(lesson.id, lessonId)).limit(1);
  if (!student || !target) return null;
  return student;
}

/** Gives one registered student access to one lesson. Other students stay blocked. */
export async function grantLessonAction(lessonId: string, userId: string): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const student = await studentAndLesson(lessonId, userId);
    if (!student || student.role !== "STUDENT" || !student.active) return fail("admin.lessons.releaseInvalid");
    await db.insert(lessonGrant).values({ lessonId, userId }).onConflictDoNothing();
    revalidatePath("/", "layout");
    return ok();
  });
}

export async function revokeLessonAction(lessonId: string, userId: string): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    if (!idSchema.safeParse(lessonId).success) return fail("errors.notFound");
    await db.delete(lessonGrant).where(and(eq(lessonGrant.lessonId, lessonId), eq(lessonGrant.userId, userId)));
    revalidatePath("/", "layout");
    return ok();
  });
}
