import type { Role } from "@/db/schema/auth";
import type { LessonStatus } from "@/db/schema/lessons";
import type { Locale } from "@/lib/i18n/config";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  preferredLocale: Locale;
  active: boolean;
};

export function isAdmin(user: Pick<CurrentUser, "role" | "active"> | null | undefined): boolean {
  return Boolean(user?.active && user.role === "ADMIN");
}

/** Students only ever see published lessons; admins can preview drafts. */
export function canViewLesson(
  user: Pick<CurrentUser, "role" | "active"> | null | undefined,
  lesson: { status: LessonStatus },
): boolean {
  if (!user?.active) return false;
  return lesson.status === "PUBLISHED" || user.role === "ADMIN";
}
