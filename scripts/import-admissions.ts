import { readFile } from "node:fs/promises";
import { parseAdmissionRecordsCsv } from "../src/lib/admissions/importer";
import type { AdmissionRecord } from "../src/lib/admissions/types";
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

  for (const record of result.records) {
    await insertAdmissionRecord(record);
  }

  await pool.end();
  console.log(`inserted_records=${result.records.length}`);
}

async function insertAdmissionRecord(record: AdmissionRecord) {
  const pool = getDbPool();
  if (!pool) {
    throw new Error("database pool unavailable");
  }

  await pool.query(
    `
      insert into admission_records (
        year,
        province,
        batch,
        plan_type,
        subject_type,
        school_code,
        school_name,
        major_group_code,
        major_group_name,
        major_code,
        major_name,
        min_score,
        min_rank,
        avg_score,
        avg_rank,
        plan_count,
        source_name,
        source_url,
        source_published_at,
        trust_level,
        notes
      )
      values (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21
      )
    `,
    [
      record.year,
      record.province,
      record.batch,
      record.planType,
      record.subjectType,
      record.schoolCode,
      record.schoolName,
      record.majorGroupCode ?? null,
      record.majorGroupName ?? null,
      record.majorCode ?? null,
      record.majorName ?? null,
      record.minScore ?? null,
      record.minRank ?? null,
      record.avgScore ?? null,
      record.avgRank ?? null,
      record.planCount ?? null,
      record.sourceName,
      record.sourceUrl ?? null,
      record.sourcePublishedAt ?? null,
      record.trustLevel,
      record.notes ?? null
    ]
  );
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  const pool = getDbPool();
  await pool?.end();
  process.exitCode = 1;
});
