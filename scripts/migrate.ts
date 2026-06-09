import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDbPool } from "../src/lib/db/client";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(rootDir, "src/lib/db/migrations");

async function main() {
  const pool = getDbPool();
  if (!pool) {
    throw new Error("DATABASE_URL 未配置，无法执行迁移。");
  }

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await pool.query(sql);
    console.log(`migrated ${file}`);
  }

  await pool.end();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  const pool = getDbPool();
  await pool?.end();
  process.exitCode = 1;
});
