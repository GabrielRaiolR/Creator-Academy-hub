"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { session, user, type Role } from "@/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { assertAdmin } from "@/lib/permissions";
import { createUserWithPassword, setUserPassword } from "@/lib/users/credentials";
import { createUserSchema, updateUserSchema } from "@/lib/validations";
import { fail, fromZodError, ok, runAction, type ActionResult } from "./result";

type UserFormInput = {
  name: string;
  email: string;
  preferredLocale: Locale;
  role: Role;
  password: string;
};

async function emailInUse(email: string, exceptId?: string): Promise<boolean> {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(exceptId ? and(eq(user.email, email), ne(user.id, exceptId)) : eq(user.email, email))
    .limit(1);
  return Boolean(row);
}

async function revokeSessions(userId: string): Promise<void> {
  await db.delete(session).where(eq(session.userId, userId));
}

export async function createUserAction(input: UserFormInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await assertAdmin();
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    if (await emailInUse(parsed.data.email)) {
      return fail("admin.students.emailTaken", { fieldErrors: { email: "admin.students.emailTaken" } });
    }

    const id = await createUserWithPassword(db, parsed.data);
    revalidatePath("/", "layout");
    return ok({ id });
  });
}

export async function updateUserAction(input: UserFormInput & { id: string; active: boolean }): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await assertAdmin();
    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const data = parsed.data;

    // Prevents an admin from locking themselves (and possibly everyone) out.
    if (data.id === admin.id && (data.role !== "ADMIN" || !data.active)) {
      return fail("admin.students.cannotChangeOwnAccess");
    }
    if (await emailInUse(data.email, data.id)) {
      return fail("admin.students.emailTaken", { fieldErrors: { email: "admin.students.emailTaken" } });
    }

    const updated = await db
      .update(user)
      .set({
        name: data.name,
        email: data.email,
        preferredLocale: data.preferredLocale,
        role: data.role,
        active: data.active,
      })
      .where(eq(user.id, data.id))
      .returning({ id: user.id });
    if (updated.length === 0) return fail("errors.notFound");

    if (data.password) await setUserPassword(db, data.id, data.password);
    if (!data.active || (data.password && data.id !== admin.id)) await revokeSessions(data.id);

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function setUserActiveAction(id: string, active: boolean): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await assertAdmin();
    if (typeof id !== "string" || typeof active !== "boolean") return fail("validation.invalid");
    if (id === admin.id) return fail("admin.students.cannotChangeOwnAccess");

    const updated = await db.update(user).set({ active }).where(eq(user.id, id)).returning({ id: user.id });
    if (updated.length === 0) return fail("errors.notFound");
    if (!active) await revokeSessions(id);

    revalidatePath("/", "layout");
    return ok();
  });
}
