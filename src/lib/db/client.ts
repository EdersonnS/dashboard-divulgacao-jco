import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@drizzle/schema";

declare global {
  var __ddPgPool: Pool | undefined;
}

const pool =
  globalThis.__ddPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__ddPgPool = pool;
}

export const db = drizzle(pool, { schema });
export { pool };
