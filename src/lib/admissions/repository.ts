import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDbPool, hasDatabaseConnection } from "@/lib/db/client";
import type { CandidateProfile } from "@/lib/profile/types";
import { parseAdmissionRecordsCsv } from "./importer";
import type { AdmissionRecord, Batch, EnrollmentPlan, PlanType, TrustLevel } from "./types";

const sampleAdmissionsPath = "fixtures/admissions/sample-admission-records.csv";

export type AdmissionRecordsLookupResult = {
  records: AdmissionRecord[];
  dataMode: "database" | "sample" | "empty";
};

export type EnrollmentPlansLookupResult = {
  plans: EnrollmentPlan[];
  dataMode: "database" | "empty";
};

export async function listAdmissionRecordsForProfile(
  profile: CandidateProfile
): Promise<AdmissionRecordsLookupResult> {
  if (hasDatabaseConnection()) {
    const databaseRecords = await listDatabaseAdmissionRecords(profile);
    return {
      records: databaseRecords,
      dataMode: databaseRecords.length > 0 ? "database" : "empty"
    };
  }

  const csv = readFileSync(join(process.cwd(), sampleAdmissionsPath), "utf8");
  const result = parseAdmissionRecordsCsv(csv);

  if (result.errors.length > 0) {
    return { records: [], dataMode: "empty" };
  }

  return { records: result.records, dataMode: "sample" };
}

export async function listEnrollmentPlansForProfile(
  profile: CandidateProfile
): Promise<EnrollmentPlansLookupResult> {
  if (!hasDatabaseConnection()) {
    return { plans: [], dataMode: "empty" };
  }

  const databasePlans = await listDatabaseEnrollmentPlans(profile);
  return {
    plans: databasePlans,
    dataMode: databasePlans.length > 0 ? "database" : "empty"
  };
}

async function listDatabaseAdmissionRecords(profile: CandidateProfile): Promise<AdmissionRecord[]> {
  const pool = getDbPool();
  if (!pool || !profile.subjectType) {
    return [];
  }

  try {
    const result = await pool.query(
      `
        select
          id,
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
          imported_at,
          notes
        from admission_records
        where province = $1
          and batch = $2
          and subject_type = $3
        order by year desc, min_rank asc nulls last
        limit 200
      `,
      [profile.province, "本科批", profile.subjectType]
    );

    return result.rows.map((row) => ({
      id: String(row.id),
      year: Number(row.year),
      province: String(row.province),
      batch: row.batch as Batch,
      planType: row.plan_type as PlanType,
      subjectType: row.subject_type,
      schoolCode: String(row.school_code ?? ""),
      schoolName: String(row.school_name),
      majorGroupCode: optionalString(row.major_group_code),
      majorGroupName: optionalString(row.major_group_name),
      majorCode: optionalString(row.major_code),
      majorName: optionalString(row.major_name),
      minScore: optionalNumber(row.min_score),
      minRank: optionalNumber(row.min_rank),
      avgScore: optionalNumber(row.avg_score),
      avgRank: optionalNumber(row.avg_rank),
      planCount: optionalNumber(row.plan_count),
      sourceName: String(row.source_name),
      sourceUrl: optionalString(row.source_url),
      sourcePublishedAt: optionalString(row.source_published_at),
      trustLevel: row.trust_level as TrustLevel,
      importedAt: optionalString(row.imported_at),
      notes: optionalString(row.notes)
    }));
  } catch {
    return [];
  }
}

async function listDatabaseEnrollmentPlans(profile: CandidateProfile): Promise<EnrollmentPlan[]> {
  const pool = getDbPool();
  if (!pool || !profile.subjectType) {
    return [];
  }

  try {
    const result = await pool.query(
      `
        select
          id,
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
          plan_count,
          tuition,
          duration,
          campus,
          requirements,
          source_name,
          source_url,
          source_published_at,
          trust_level,
          imported_at,
          notes
        from enrollment_plans
        where province = $1
          and batch = $2
          and subject_type = $3
        order by year desc, school_name asc, major_name asc nulls last
        limit 500
      `,
      [profile.province, "本科批", profile.subjectType]
    );

    return result.rows.map((row) => ({
      id: String(row.id),
      year: Number(row.year),
      province: String(row.province),
      batch: row.batch as Batch,
      planType: row.plan_type as PlanType,
      subjectType: row.subject_type,
      schoolCode: String(row.school_code ?? ""),
      schoolName: String(row.school_name),
      majorGroupCode: optionalString(row.major_group_code),
      majorGroupName: optionalString(row.major_group_name),
      majorCode: optionalString(row.major_code),
      majorName: optionalString(row.major_name),
      planCount: Number(row.plan_count),
      tuition: optionalString(row.tuition),
      duration: optionalString(row.duration),
      campus: optionalString(row.campus),
      requirements: optionalString(row.requirements),
      sourceName: String(row.source_name),
      sourceUrl: optionalString(row.source_url),
      sourcePublishedAt: optionalString(row.source_published_at),
      trustLevel: row.trust_level as TrustLevel,
      importedAt: optionalString(row.imported_at),
      notes: optionalString(row.notes)
    }));
  } catch {
    return [];
  }
}

function optionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const stringValue = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return stringValue.trim() ? stringValue : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}
