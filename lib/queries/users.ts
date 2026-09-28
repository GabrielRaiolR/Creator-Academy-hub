import "server-only";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

const userColumns = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  preferredLocale: user.preferredLocale,
  active: user.active,
  createdAt: user.createdAt,
};

export type UserListItem = Awaited<ReturnType<typeof listUsers>>[number];

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function listUsers({ query }: { query?: string }) {
  const term = query?.trim();
  const where = term
    ? or(ilike(user.name, `%${escapeLike(term)}%`), ilike(user.email, `%${escapeLike(term)}%`))
    : undefined;

  return db.select(userColumns).from(user).where(where).orderBy(desc(user.createdAt)).limit(500);
}

export async function getUserById(id: string) {
  const [row] = await db.select(userColumns).from(user).where(eq(user.id, id)).limit(1);
  return row ?? null;
}

export async function countActiveStudents(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(user)
    .where(and(eq(user.role, "STUDENT"), eq(user.active, true)));
  return row?.value ?? 0;
}
