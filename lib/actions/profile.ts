"use server";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { assertUser } from "@/lib/permissions";
import { changePasswordSchema, localeSchema, profileSchema } from "@/lib/validations";
import { setLocaleCookie } from "./locale-cookie";
import { fail, fromZodError, ok, runAction, type ActionResult } from "./result";

export async function updateProfileAction(input: { name: string; preferredLocale: Locale }): Promise<ActionResult> {
  return runAction(async () => {
    const current = await assertUser();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    // Only name and language: role, email and status are admin-managed.
    await db
      .update(user)
      .set({ name: parsed.data.name, preferredLocale: parsed.data.preferredLocale })
      .where(eq(user.id, current.id));
    await setLocaleCookie(parsed.data.preferredLocale);
    revalidatePath("/", "layout");
    return ok();
  });
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    await assertUser();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: parsed.data.currentPassword,
          newPassword: parsed.data.newPassword,
          revokeOtherSessions: true,
        },
        headers: await headers(),
      });
    } catch (error) {
      if (error instanceof APIError && error.statusCode < 500) {
        return fail("profile.wrongPassword", { fieldErrors: { currentPassword: "profile.wrongPassword" } });
      }
      throw error;
    }
    return ok();
  });
}

/** Called by the language switcher: remembers the choice in a cookie and, when signed in, on the profile. */
export async function setPreferredLocaleAction(locale: Locale): Promise<ActionResult> {
  return runAction(async () => {
    const parsed = localeSchema.safeParse(locale);
    if (!parsed.success) return fromZodError(parsed.error);

    await setLocaleCookie(parsed.data);
    const current = await getCurrentUser();
    if (current && current.preferredLocale !== parsed.data) {
      await db.update(user).set({ preferredLocale: parsed.data }).where(eq(user.id, current.id));
    }
    return ok();
  });
}
