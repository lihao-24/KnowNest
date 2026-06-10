import type { CandidateBucket, DataSourceSummary } from "@/lib/chat/types";
import type { Batch, PlanType } from "@/lib/admissions/types";
import { getDbPool, hasDatabaseConnection } from "./client";

export type SavedChoice = {
  id: string;
  userId: string;
  sessionId: string | null;
  candidateId: string;
  schoolName: string;
  majorName: string | null;
  batch: Batch;
  planType: PlanType;
  bucket: CandidateBucket;
  rationale: string | null;
  riskTags: string[];
  sources: DataSourceSummary[];
  note: string | null;
  isSaved: true;
  createdAt: string;
};

export type SaveChoiceInput = {
  userId: string;
  sessionId?: string | null;
  candidateId: string;
  schoolName: string;
  majorName?: string | null;
  batch: Batch;
  planType: PlanType;
  bucket: CandidateBucket;
  rationale?: string | null;
  riskTags?: readonly string[];
  sources?: readonly DataSourceSummary[] | ReadonlyArray<Record<string, unknown>>;
  note?: string | null;
};

const fallbackSavedChoices = new Map<string, SavedChoice[]>();

export async function listSavedChoicesForUser(userId: string): Promise<SavedChoice[]> {
  if (!hasDatabaseConnection()) {
    return getFallbackChoicesForUser(userId);
  }

  const pool = getDbPool();
  if (!pool) {
    return getFallbackChoicesForUser(userId);
  }

  try {
    const result = await pool.query(
      `
        select
          id,
          user_id,
          session_id,
          candidate_id,
          school_name,
          major_name,
          batch,
          plan_type,
          bucket,
          rationale,
          risk_tags,
          sources,
          note,
          created_at
        from saved_choices
        where user_id = $1
        order by created_at desc
      `,
      [userId]
    );

    return result.rows.map(toSavedChoice);
  } catch {
    return getFallbackChoicesForUser(userId);
  }
}

export async function saveChoiceForUser(input: SaveChoiceInput): Promise<SavedChoice> {
  if (!hasDatabaseConnection()) {
    return saveFallbackChoice(input);
  }

  const pool = getDbPool();
  if (!pool) {
    return saveFallbackChoice(input);
  }

  try {
    const result = await pool.query(
      `
        insert into saved_choices (
          user_id,
          session_id,
          candidate_id,
          school_name,
          major_name,
          batch,
          plan_type,
          bucket,
          rationale,
          risk_tags,
          sources,
          note
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        on conflict (user_id, candidate_id)
        do update set
          session_id = excluded.session_id,
          school_name = excluded.school_name,
          major_name = excluded.major_name,
          batch = excluded.batch,
          plan_type = excluded.plan_type,
          bucket = excluded.bucket,
          rationale = excluded.rationale,
          risk_tags = excluded.risk_tags,
          sources = excluded.sources,
          note = coalesce(excluded.note, saved_choices.note)
        returning
          id,
          user_id,
          session_id,
          candidate_id,
          school_name,
          major_name,
          batch,
          plan_type,
          bucket,
          rationale,
          risk_tags,
          sources,
          note,
          created_at
      `,
      [
        input.userId,
        input.sessionId ?? null,
        input.candidateId,
        input.schoolName,
        input.majorName ?? null,
        input.batch,
        input.planType,
        input.bucket,
        input.rationale ?? null,
        [...(input.riskTags ?? [])],
        input.sources ?? [],
        input.note ?? null
      ]
    );

    return toSavedChoice(result.rows[0]);
  } catch {
    return saveFallbackChoice(input);
  }
}

export async function deleteSavedChoiceForUser(
  userId: string,
  candidateId: string
): Promise<{ deleted: boolean }> {
  if (!hasDatabaseConnection()) {
    return deleteFallbackChoice(userId, candidateId);
  }

  const pool = getDbPool();
  if (!pool) {
    return deleteFallbackChoice(userId, candidateId);
  }

  try {
    const result = await pool.query(
      `
        delete from saved_choices
        where user_id = $1 and candidate_id = $2
      `,
      [userId, candidateId]
    );

    return { deleted: (result.rowCount ?? 0) > 0 };
  } catch {
    return deleteFallbackChoice(userId, candidateId);
  }
}

function getFallbackChoicesForUser(userId: string): SavedChoice[] {
  return fallbackSavedChoices.get(userId) ?? [];
}

function saveFallbackChoice(input: SaveChoiceInput): SavedChoice {
  const choices = getFallbackChoicesForUser(input.userId);
  const existingIndex = choices.findIndex((choice) => choice.candidateId === input.candidateId);
  const existing = existingIndex >= 0 ? choices[existingIndex] : undefined;
  const savedChoice: SavedChoice = {
    id: existing?.id ?? crypto.randomUUID(),
    userId: input.userId,
    sessionId: input.sessionId ?? null,
    candidateId: input.candidateId,
    schoolName: input.schoolName,
    majorName: input.majorName ?? null,
    batch: input.batch,
    planType: input.planType,
    bucket: input.bucket,
    rationale: input.rationale ?? null,
    riskTags: [...(input.riskTags ?? [])],
    sources: normalizeSources(input.sources ?? []),
    note: input.note ?? existing?.note ?? null,
    isSaved: true,
    createdAt: existing?.createdAt ?? new Date().toISOString()
  };

  const nextChoices =
    existingIndex >= 0
      ? choices.map((choice, index) => (index === existingIndex ? savedChoice : choice))
      : [savedChoice, ...choices];
  fallbackSavedChoices.set(input.userId, nextChoices);

  return savedChoice;
}

function deleteFallbackChoice(userId: string, candidateId: string): { deleted: boolean } {
  const choices = getFallbackChoicesForUser(userId);
  const nextChoices = choices.filter((choice) => choice.candidateId !== candidateId);
  fallbackSavedChoices.set(userId, nextChoices);

  return { deleted: nextChoices.length !== choices.length };
}

function toSavedChoice(row: Record<string, unknown>): SavedChoice {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    sessionId: row.session_id ? String(row.session_id) : null,
    candidateId: String(row.candidate_id),
    schoolName: String(row.school_name),
    majorName: row.major_name ? String(row.major_name) : null,
    batch: row.batch as Batch,
    planType: row.plan_type as PlanType,
    bucket: row.bucket as CandidateBucket,
    rationale: row.rationale ? String(row.rationale) : null,
    riskTags: Array.isArray(row.risk_tags) ? row.risk_tags.map(String) : [],
    sources: normalizeSources(row.sources),
    note: row.note ? String(row.note) : null,
    isSaved: true,
    createdAt: formatTimestamp(row.created_at)
  };
}

function normalizeSources(value: unknown): DataSourceSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isDataSourceSummary);
}

function isDataSourceSummary(value: unknown): value is DataSourceSummary {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = value as Partial<DataSourceSummary>;
  return (
    typeof source.title === "string" &&
    typeof source.trustLevel === "string" &&
    typeof source.status === "string" &&
    typeof source.detail === "string"
  );
}

function formatTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}
