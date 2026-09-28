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

/**
 * Admins can preview every lesson. A student sees a lesson only when it is published
 * and an admin has released it to that student.
 */
export function canViewLesson(
  user: Pick<CurrentUser, "role" | "active"> | null | undefined,
  lesson: { status: LessonStatus },
  granted = false,
): boolean {
  if (!user?.active) return false;
  if (user.role === "ADMIN") return true;
  return lesson.status === "PUBLISHED" && granted;
}
