import { describe, expect, it, vi } from "vitest";
import { parseScoreSegmentsCsv } from "./score-segments";
import { listScoreSegmentsForProfile } from "./score-segment-repository";
import { getDbPool, hasDatabaseConnection } from "@/lib/db/client";

vi.mock("@/lib/db/client", () => ({
  getDbPool: vi.fn(),
  hasDatabaseConnection: vi.fn()
}));

const mockedGetDbPool = vi.mocked(getDbPool);
const mockedHasDatabaseConnection = vi.mocked(hasDatabaseConnection);

describe("score segments", () => {
  it("parses sample score segment CSV rows", () => {
    const result = parseScoreSegmentsCsv(
      [
        "year,province,subject_type,score,same_score_count,cumulative_count,source_name,trust_level,notes",
        "2026,河南,物理类,580,120,30000,虚构样例,T5,不用于真实填报"
      ].join("\n")
    );

    expect(result.errors).toEqual([]);
    expect(result.segments).toEqual([
      expect.objectContaining({
        year: 2026,
        province: "河南",
        subjectType: "物理类",
        score: 580,
        sameScoreCount: 120,
        cumulativeCount: 30000,
        trustLevel: "T5"
      })
    ]);
  });

  it("reports row-level errors for invalid score segment rows", () => {
    const result = parseScoreSegmentsCsv(
      [
        "year,province,subject_type,score,same_score_count,cumulative_count,source_name",
        "2026,河南,理科,abc,120,30000,虚构样例"
      ].join("\n")
    );

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ row: 2, field: "subject_type" }),
        expect.objectContaining({ row: 2, field: "score" })
      ])
    );
    expect(result.segments).toEqual([]);
  });

  it("loads sample score segments when database is disabled", async () => {
    mockedHasDatabaseConnection.mockReturnValue(false);
    mockedGetDbPool.mockReturnValue(null);

    const result = await listScoreSegmentsForProfile({
      province: "河南",
      score: 580,
      rank: 30000,
      subjectType: "物理类",
      preferredRegions: [],
      excludedRegions: [],
      interestedMajors: [],
      excludedMajors: []
    });

    expect(result.dataMode).toBe("sample");
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.nearestSegment?.score).toBe(580);
  });
});
