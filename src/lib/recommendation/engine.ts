import type { AdmissionRecord, EnrollmentPlan } from "@/lib/admissions/types";
import type { CandidateProfile } from "@/lib/profile/types";
import type {
  MissingSource,
  RecommendationBucket,
  RecommendationCandidate,
  RecommendationResult
} from "./types";

type RecommendationOptions = {
  targetProvince?: string;
  targetBatch?: "本科批";
  hasEnrollmentPlans?: boolean;
  enrollmentPlans?: EnrollmentPlan[];
};

export function buildRecommendations(
  profile: CandidateProfile,
  records: AdmissionRecord[],
  options: RecommendationOptions = {}
): RecommendationResult {
  const targetProvince = options.targetProvince ?? "河南";
  const targetBatch = options.targetBatch ?? "本科批";
  const enrollmentPlans = options.enrollmentPlans ?? [];
  const hasEnrollmentPlans = options.hasEnrollmentPlans ?? enrollmentPlans.length > 0;

  const candidates = records
    .filter((record) => record.province === targetProvince)
    .filter((record) => record.batch === targetBatch)
    .filter((record) => record.subjectType === profile.subjectType)
    .filter((record) => {
      if (record.planType !== "国家专项计划") {
        return true;
      }

      return profile.eligibleNationalSpecialPlan === true;
    })
    .filter((record) => matchesProfilePreferences(profile, record))
    .map((record) =>
      toCandidate(profile, record, hasEnrollmentPlans, findMatchingEnrollmentPlan(record, enrollmentPlans))
    )
    .filter((candidate): candidate is RecommendationCandidate => candidate !== undefined)
    .sort((left, right) => bucketOrder(left.bucket) - bucketOrder(right.bucket));

  return {
    candidates,
    missingSources: collectMissingSources(candidates)
  };
}

function toCandidate(
  profile: CandidateProfile,
  record: AdmissionRecord,
  hasEnrollmentPlans: boolean,
  enrollmentPlan: EnrollmentPlan | undefined
): RecommendationCandidate | undefined {
  if (profile.rank === undefined || record.minRank === undefined) {
    return undefined;
  }

  const bucket = classifyByRank(profile.rank, record.minRank);
  if (!bucket) {
    return undefined;
  }

  const riskTags: string[] = [];
  const missingSources: MissingSource[] = [];

  if (!hasEnrollmentPlans || !enrollmentPlan) {
    riskTags.push("缺少当年招生计划");
    missingSources.push("enrollment_plans");
  }

  if (
    enrollmentPlan &&
    record.planCount !== undefined &&
    enrollmentPlan.planCount < record.planCount
  ) {
    riskTags.push("当年招生计划减少");
  }

  return {
    candidateId: record.id ?? buildCandidateId(record),
    bucket,
    schoolName: record.schoolName,
    majorName: record.majorName,
    planType: record.planType,
    admissionRecord: record,
    enrollmentPlan,
    riskTags,
    missingSources
  };
}

function findMatchingEnrollmentPlan(
  record: AdmissionRecord,
  plans: EnrollmentPlan[]
): EnrollmentPlan | undefined {
  return plans.find(
    (plan) =>
      plan.province === record.province &&
      plan.batch === record.batch &&
      plan.planType === record.planType &&
      plan.subjectType === record.subjectType &&
      plan.schoolCode === record.schoolCode &&
      sameOptionalCode(plan.majorGroupCode, record.majorGroupCode) &&
      sameOptionalCode(plan.majorCode, record.majorCode)
  );
}

function sameOptionalCode(left: string | undefined, right: string | undefined): boolean {
  return (left ?? "") === (right ?? "");
}

function classifyByRank(profileRank: number, recordMinRank: number): RecommendationBucket | undefined {
  const ratio = recordMinRank / profileRank;

  if (ratio >= 0.85 && ratio < 1) {
    return "冲";
  }

  if (ratio >= 1 && ratio <= 1.2) {
    return "稳";
  }

  if (ratio > 1.2 && ratio <= 1.6) {
    return "保";
  }

  return undefined;
}

function matchesProfilePreferences(profile: CandidateProfile, record: AdmissionRecord): boolean {
  const searchableText = [record.schoolName, record.majorName, record.majorGroupName, record.notes]
    .filter(Boolean)
    .join(" ");

  if (profile.excludedRegions.some((region) => searchableText.includes(region))) {
    return false;
  }

  if (profile.excludedMajors.some((major) => searchableText.includes(major))) {
    return false;
  }

  return true;
}

function collectMissingSources(candidates: RecommendationCandidate[]): MissingSource[] {
  return [...new Set(candidates.flatMap((candidate) => candidate.missingSources))];
}

function bucketOrder(bucket: RecommendationBucket): number {
  return { 冲: 0, 稳: 1, 保: 2 }[bucket];
}

function buildCandidateId(record: AdmissionRecord): string {
  return [
    record.year,
    record.planType,
    record.subjectType,
    record.schoolCode,
    record.majorGroupCode,
    record.majorCode
  ]
    .filter(Boolean)
    .join(":");
}
