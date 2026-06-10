import { describe, expect, it } from "vitest";
import { buildRecommendations } from "./engine";
import type { AdmissionRecord, EnrollmentPlan } from "@/lib/admissions/types";
import type { CandidateProfile } from "@/lib/profile/types";

const baseProfile: CandidateProfile = {
  province: "河南",
  score: 580,
  rank: 30000,
  subjectType: "物理类",
  eligibleNationalSpecialPlan: false,
  preferredRegions: ["河南"],
  excludedRegions: [],
  interestedMajors: [],
  excludedMajors: [],
  primaryGoal: "稳定"
};

const records: AdmissionRecord[] = [
  {
    id: "regular-safe",
    year: 2025,
    province: "河南",
    batch: "本科批",
    planType: "普通本科批",
    subjectType: "物理类",
    schoolCode: "10001",
    schoolName: "河南样例大学",
    majorCode: "080901",
    majorName: "计算机类",
    minScore: 570,
    minRank: 36000,
    planCount: 80,
    sourceName: "河南省教育考试院",
    trustLevel: "T1"
  },
  {
    id: "national-special",
    year: 2025,
    province: "河南",
    batch: "本科批",
    planType: "国家专项计划",
    subjectType: "物理类",
    schoolCode: "10002",
    schoolName: "专项样例大学",
    majorCode: "080901",
    majorName: "计算机类",
    minScore: 575,
    minRank: 33000,
    planCount: 10,
    sourceName: "河南省教育考试院",
    trustLevel: "T1"
  }
];

const enrollmentPlans: EnrollmentPlan[] = [
  {
    id: "regular-safe-plan",
    year: 2026,
    province: "河南",
    batch: "本科批",
    planType: "普通本科批",
    subjectType: "物理类",
    schoolCode: "10001",
    schoolName: "河南样例大学",
    majorCode: "080901",
    majorName: "计算机类",
    planCount: 50,
    sourceName: "河南省教育考试院",
    trustLevel: "T1"
  }
];

describe("buildRecommendations", () => {
  it("filters national special plan records when the user has no eligibility", () => {
    const result = buildRecommendations(baseProfile, records);

    expect(result.candidates.map((candidate) => candidate.planType)).not.toContain(
      "国家专项计划"
    );
    expect(result.candidates).toHaveLength(1);
  });

  it("marks missing enrollment plan data as a risk instead of pretending complete data", () => {
    const result = buildRecommendations(baseProfile, records);

    expect(result.candidates[0].riskTags).toContain("缺少当年招生计划");
    expect(result.candidates[0].missingSources).toContain("enrollment_plans");
  });

  it("uses matching enrollment plans to mark plan decrease risk without missing plan source", () => {
    const result = buildRecommendations(baseProfile, records, { enrollmentPlans });

    expect(result.candidates[0].missingSources).not.toContain("enrollment_plans");
    expect(result.candidates[0].riskTags).toContain("当年招生计划减少");
    expect(result.candidates[0].enrollmentPlan?.planCount).toBe(50);
  });
});
