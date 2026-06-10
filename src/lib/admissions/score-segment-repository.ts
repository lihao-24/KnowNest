import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDbPool, hasDatabaseConnection } from "@/lib/db/client";
import type { CandidateProfile } from "@/lib/profile/types";
import { parseScoreSegmentsCsv } from "./score-segments";
import type { ScoreSegment, TrustLevel } from "./types";

const sampleScoreSegmentsPath = "fixtures/admissions/sample-score-segments.csv";

export type ScoreSegmentsLookupResult = {
  segments: ScoreSegment[];
  nearestSegment: ScoreSegment | null;
  dataMode: "database" | "sample" | "empty";
};

export async function listScoreSegmentsForProfile(
  profile: CandidateProfile
): Promise<ScoreSegmentsLookupResult> {
  if (hasDatabaseConnection()) {
    const databaseSegments = await listDatabaseScoreSegments(profile);
    return {
      segments: databaseSegments,
      nearestSegment: findNearestSegment(profile, databaseSegments),
      dataMode: databaseSegments.length > 0 ? "database" : "empty"
    };
  }

  const csv = readFileSync(join(process.cwd(), sampleScoreSegmentsPath), "utf8");
  const result = parseScoreSegmentsCsv(csv);

  if (result.errors.length > 0) {
    return { segments: [], nearestSegment: null, dataMode: "empty" };
  }

  const segments = filterSegmentsForProfile(profile, result.segments);

  return {
    segments,
    nearestSegment: findNearestSegment(profile, segments),
    dataMode: "sample"
  };
}

function filterSegmentsForProfile(profile: CandidateProfile, segments: ScoreSegment[]): ScoreSegment[] {
  return segments.filter(
    (segment) =>
      segment.province === profile.province &&
      (!profile.subjectType || segment.subjectType === profile.subjectType)
  );
}

async function listDatabaseScoreSegments(profile: CandidateProfile): Promise<ScoreSegment[]> {
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
          subject_type,
          score,
          same_score_count,
          cumulative_count,
          source_name,
          source_url,
          source_published_at,
          trust_level,
          imported_at,
          notes
        from score_segments
        where province = $1
          and subject_type = $2
        order by year desc, score desc
        limit 500
      `,
      [profile.province, profile.subjectType]
    );

    return result.rows.map((row) => ({
      id: String(row.id),
      year: Number(row.year),
      province: String(row.province),
      subjectType: row.subject_type,
      score: Number(row.score),
      sameScoreCount: Number(row.same_score_count),
      cumulativeCount: Number(row.cumulative_count),
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

function findNearestSegment(
  profile: CandidateProfile,
  segments: ScoreSegment[]
): ScoreSegment | null {
  if (!profile.score) {
    return null;
  }
  const score = profile.score;

  return (
    segments
      .slice()
      .sort(
        (left, right) =>
          Math.abs(left.score - score) - Math.abs(right.score - score)
      )[0] ?? null
  );
}

function optionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const stringValue = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return stringValue.trim() ? stringValue : undefined;
}
