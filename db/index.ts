import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * node-postgres works both with Neon (use the pooled connection string) and with a local
 * PostgreSQL, and supports interactive transactions.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10_000,
});

// Lets Vercel Fluid compute close idle clients before a function instance is suspended.
attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema });

export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
