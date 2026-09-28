import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { localePath, type LocaleSegment } from "@/lib/i18n/config";
import { isAdmin, type CurrentUser } from "./rules";

export { canViewLesson, isAdmin, type CurrentUser } from "./rules";

export class AccessError extends Error {
  constructor(public readonly code: "UNAUTHORIZED" | "FORBIDDEN") {
    super(code);
    this.name = "AccessError";
  }
}

/** Pages and layouts: sends anonymous visitors to the login page. */
export async function requireUser(segment: LocaleSegment): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(localePath(segment, "/login"));
  return user;
}

/** Pages and layouts: non-admins are sent back to the student home. */
export async function requireAdmin(segment: LocaleSegment): Promise<CurrentUser> {
  const user = await requireUser(segment);
  if (!isAdmin(user)) redirect(localePath(segment));
  return user;
}

/** Server Actions and Route Handlers: throws instead of redirecting. */
export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AccessError("UNAUTHORIZED");
  return user;
}

export async function assertAdmin(): Promise<CurrentUser> {
  const user = await assertUser();
  if (!isAdmin(user)) throw new AccessError("FORBIDDEN");
  return user;
}
