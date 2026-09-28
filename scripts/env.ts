import { config } from "dotenv";

// Imported first by every script so DATABASE_URL etc. exist before `@/db` creates the pool.
config({ path: [".env.local", ".env"], quiet: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não está definida. Copie .env.example para .env.local e preencha.");
  process.exit(1);
}
