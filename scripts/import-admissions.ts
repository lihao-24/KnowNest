import { readFile } from "node:fs/promises";
import { importAdmissionRecords } from "../src/lib/admissions/db-import";
import { parseAdmissionRecordsCsv } from "../src/lib/admissions/importer";
import { getDbPool, hasDatabaseConnection } from "../src/lib/db/client";

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    throw new Error("用法：pnpm import:admissions <path-to-csv>");
  }

  const csv = await readFile(csvPath, "utf8");
  const result = parseAdmissionRecordsCsv(csv);

  console.log(`valid_records=${result.records.length}`);
  console.log(`errors=${result.errors.length}`);

  for (const error of result.errors) {
    console.error(`row=${error.row} field=${error.field} message=${error.message}`);
  }

  if (result.errors.length > 0) {
    process.exitCode = 1;
    return;
  }

  if (!hasDatabaseConnection()) {
    console.log("DATABASE_URL 未配置，仅完成 CSV 校验，未写入数据库。");
    return;
  }

  const pool = getDbPool();
  if (!pool) {
    console.log("数据库连接不可用，仅完成 CSV 校验，未写入数据库。");
    return;
  }

  await importAdmissionRecords(result.records, pool);

  await pool.end();
  console.log(`inserted_records=${result.records.length}`);
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  const pool = getDbPool();
  await pool?.end();
  process.exitCode = 1;
});
