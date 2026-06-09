import { Pool } from "pg";

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  if (!hasDatabaseConnection()) {
    return null;
  }

  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL
  });

  return pool;
}

export function hasDatabaseConnection(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL !== "disabled");
}
