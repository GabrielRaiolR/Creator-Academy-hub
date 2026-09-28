import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, localeToSegment, type Locale } from "@/lib/i18n/config";

export async function setLocaleCookie(locale: Locale): Promise<void> {
  (await cookies()).set(LOCALE_COOKIE, localeToSegment(locale), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
