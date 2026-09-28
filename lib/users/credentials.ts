import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { account, user, type Role } from "@/db/schema";
import type { Locale } from "@/lib/i18n/config";

/** Better Auth stores email/password credentials in `account` with this provider id. */
const CREDENTIAL_PROVIDER = "credential";

export type NewUserInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
  preferredLocale: Locale;
};

/**
 * Creates a user and its email/password credential in one transaction.
 * Public sign-up is disabled, so this is the only way accounts come into existence.
 */
export async function createUserWithPassword(db: Database, input: NewUserInput): Promise<string> {
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id,
      name: input.name,
      email: input.email.toLowerCase(),
      emailVerified: true,
      role: input.role,
      preferredLocale: input.preferredLocale,
      active: true,
    });
    await tx.insert(account).values({
      id: crypto.randomUUID(),
      accountId: id,
      providerId: CREDENTIAL_PROVIDER,
      userId: id,
      password: passwordHash,
    });
  });

  return id;
}

export async function setUserPassword(db: Database, userId: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  const updated = await db
    .update(account)
    .set({ password: passwordHash })
    .where(and(eq(account.userId, userId), eq(account.providerId, CREDENTIAL_PROVIDER)))
    .returning({ id: account.id });

  if (updated.length === 0) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: CREDENTIAL_PROVIDER,
      userId,
      password: passwordHash,
    });
  }
}
