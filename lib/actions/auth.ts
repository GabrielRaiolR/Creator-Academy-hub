"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { defaultLocale, isLocale, isLocaleSegment, localePath, localeToSegment } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages";
import { loginSchema } from "@/lib/validations";
import { setLocaleCookie } from "./locale-cookie";

export type LoginState = { error?: MessageKey; email?: string };

/** Only same-app, locale-prefixed paths are accepted as post-login destinations. */
function safeNextPath(value: string | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return isLocaleSegment(value.split("/")[1]) ? value : null;
}

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: "auth.invalidCredentials", email };

  let preferredLocale = defaultLocale;
  try {
    const result = await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
    if (isLocale(result.user.preferredLocale)) preferredLocale = result.user.preferredLocale;
  } catch (error) {
    if (error instanceof APIError) {
      if (error.body?.code === "ACCOUNT_DISABLED") return { error: "auth.accountDisabled", email };
      if (error.statusCode === 429) return { error: "auth.tooManyAttempts", email };
      return { error: "auth.invalidCredentials", email };
    }
    console.error("[login]", error);
    return { error: "errors.generic", email };
  }

  await setLocaleCookie(preferredLocale);
  redirect(safeNextPath(parsed.data.next) ?? localePath(localeToSegment(preferredLocale)));
}

export async function logoutAction(formData: FormData): Promise<void> {
  const segment = formData.get("locale");
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    console.error("[logout]", error);
  }
  redirect(localePath(isLocaleSegment(segment) ? segment : localeToSegment(defaultLocale), "/login"));
}
