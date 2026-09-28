import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { roles, type Role } from "@/db/schema/auth";
import { auth } from "@/lib/auth";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import type { CurrentUser } from "@/lib/permissions/rules";

function toRole(value: unknown): Role {
  return (roles as readonly unknown[]).includes(value) ? (value as Role) : "STUDENT";
}

/**
 * Resolves the signed-in user from the session cookie (validated against the database).
 * Returns null when there's no session or the account is deactivated.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { user } = session;
  if (user.active !== true) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toRole(user.role),
    preferredLocale: isLocale(user.preferredLocale) ? user.preferredLocale : defaultLocale,
    active: true,
  };
});
