/**
 * Creates (or promotes) an ADMIN account. Public sign-up is disabled, so this is how the
 * first administrator gets in.
 *
 *   npm run admin:create -- --name "Nome" --email admin@exemplo.com --password "senha-forte"
 *
 * Missing flags fall back to SEED_ADMIN_NAME / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 */
import "./env";
import { parseArgs } from "node:util";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { createUserWithPassword, setUserPassword } from "@/lib/users/credentials";
import { createUserSchema } from "@/lib/validations";

async function main() {
  const { values } = parseArgs({
    options: {
      name: { type: "string" },
      email: { type: "string" },
      password: { type: "string" },
      locale: { type: "string" },
    },
  });

  const parsed = createUserSchema.safeParse({
    name: values.name ?? process.env.SEED_ADMIN_NAME ?? "Administrador",
    email: values.email ?? process.env.SEED_ADMIN_EMAIL,
    password: values.password ?? process.env.SEED_ADMIN_PASSWORD,
    preferredLocale: values.locale ?? "pt-BR",
    role: "ADMIN",
  });
  if (!parsed.success) {
    console.error("Dados inválidos:", parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", "));
    console.error('Uso: npm run admin:create -- --name "Nome" --email admin@exemplo.com --password "min. 8 caracteres"');
    process.exitCode = 1;
    return;
  }
  const input = parsed.data;

  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, input.email)).limit(1);
  if (existing) {
    await db.update(user).set({ role: "ADMIN", active: true, name: input.name }).where(eq(user.id, existing.id));
    await setUserPassword(db, existing.id, input.password);
    console.log(`Conta existente promovida a ADMIN e senha redefinida: ${input.email}`);
    return;
  }

  await createUserWithPassword(db, input);
  console.log(`ADMIN criado: ${input.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
