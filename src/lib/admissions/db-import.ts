import type { AdmissionRecord, EnrollmentPlan, SchoolDocument, ScoreSegment } from "./types";

export type AdmissionImportQueryClient = {
  query(sql: string, values: unknown[]): Promise<unknown>;
};

export async function importAdmissionRecords(
  records: AdmissionRecord[],
  client: AdmissionImportQueryClient
): Promise<void> {
  for (const record of records) {
    await insertAdmissionRecord(record, client);
  }
}

export async function importEnrollmentPlans(
  plans: EnrollmentPlan[],
  client: AdmissionImportQueryClient
): Promise<void> {
  for (const plan of plans) {
    await insertEnrollmentPlan(plan, client);
  }
}

export async function importScoreSegments(
  segments: ScoreSegment[],
  client: AdmissionImportQueryClient
): Promise<void> {
  for (const segment of segments) {
    await insertScoreSegment(segment, client);
  }
}

export async function importSchoolDocuments(
  documents: SchoolDocument[],
  client: AdmissionImportQueryClient
): Promise<void> {
  for (const document of documents) {
    await insertSchoolDocument(document, client);
  }
}

async function insertAdmissionRecord(
  record: AdmissionRecord,
  client: AdmissionImportQueryClient
): Promise<void> {
  await client.query(
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

async function insertEnrollmentPlan(
  plan: EnrollmentPlan,
  client: AdmissionImportQueryClient
): Promise<void> {
  await client.query(
    `
      insert into enrollment_plans (
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
      plan.year,
      plan.province,
      plan.batch,
      plan.planType,
      plan.subjectType,
      plan.schoolCode,
      plan.schoolName,
      plan.majorGroupCode ?? null,
      plan.majorGroupName ?? null,
      plan.majorCode ?? null,
      plan.majorName ?? null,
      plan.planCount,
      plan.tuition ?? null,
      plan.duration ?? null,
      plan.campus ?? null,
      plan.requirements ?? null,
      plan.sourceName,
      plan.sourceUrl ?? null,
      plan.sourcePublishedAt ?? null,
      plan.trustLevel,
      plan.notes ?? null
    ]
  );
}

async function insertScoreSegment(
  segment: ScoreSegment,
  client: AdmissionImportQueryClient
): Promise<void> {
  await client.query(
    `
      insert into score_segments (
        year,
        province,
        subject_type,
        score,
        same_score_count,
        cumulative_count,
        source_name,
        source_url,
        source_published_at,
        trust_level,
        notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (year, province, subject_type, score)
      do update set
        same_score_count = excluded.same_score_count,
        cumulative_count = excluded.cumulative_count,
        source_name = excluded.source_name,
        source_url = excluded.source_url,
        source_published_at = excluded.source_published_at,
        trust_level = excluded.trust_level,
        notes = excluded.notes
    `,
    [
      segment.year,
      segment.province,
      segment.subjectType,
      segment.score,
      segment.sameScoreCount,
      segment.cumulativeCount,
      segment.sourceName,
      segment.sourceUrl ?? null,
      segment.sourcePublishedAt ?? null,
      segment.trustLevel,
      segment.notes ?? null
    ]
  );
}

async function insertSchoolDocument(
  document: SchoolDocument,
  client: AdmissionImportQueryClient
): Promise<void> {
  await client.query(
    `
      insert into school_documents (
        year,
        school_code,
        school_name,
        doc_type,
        title,
        source_name,
        source_url,
        published_at,
        trust_level,
        content
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      document.year,
      document.schoolCode,
      document.schoolName,
      document.docType,
      document.title,
      document.sourceName,
      document.sourceUrl ?? null,
      document.publishedAt ?? null,
      document.trustLevel,
      document.content
    ]
  );
}
