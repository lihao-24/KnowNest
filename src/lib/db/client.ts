import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

declare global {
  // Reuse the pool during local HMR so dev reloads do not open extra connections.
  var knowNestDbPool: Pool | undefined;
}

function readDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL environment variable. Add it to .env.local and restart the Next.js server.",
    );
  }

  return databaseUrl;
}

function createPool() {
  return new Pool({
    connectionString: readDatabaseUrl(),
  });
}

const pool = globalThis.knowNestDbPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.knowNestDbPool = pool;
}

export const db = drizzle(pool);
