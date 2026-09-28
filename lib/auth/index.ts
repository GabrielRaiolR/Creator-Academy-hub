import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const PASSWORD_MIN_LENGTH = 8;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Accounts are created exclusively by an ADMIN (see lib/users/create-user.ts).
    disableSignUp: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
  },
  user: {
    additionalFields: {
      role: { type: ["ADMIN", "STUDENT"], required: false, defaultValue: "STUDENT", input: false },
      preferredLocale: { type: "string", required: false, defaultValue: "pt-BR", input: false },
      active: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    session: {
      create: {
        // Deactivated users can't open new sessions, even with the right password.
        before: async (session) => {
          const [owner] = await db
            .select({ active: schema.user.active })
            .from(schema.user)
            .where(eq(schema.user.id, session.userId))
            .limit(1);
          if (!owner?.active) {
            throw new APIError("FORBIDDEN", { message: "ACCOUNT_DISABLED", code: "ACCOUNT_DISABLED" });
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});
