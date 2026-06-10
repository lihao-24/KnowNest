import type { AdmissionRecord, EnrollmentPlan, PlanType } from "@/lib/admissions/types";

export type RecommendationBucket = "冲" | "稳" | "保";
export type MissingSource = "enrollment_plans" | "admission_records" | "school_documents";

export type RecommendationCandidate = {
  candidateId: string;
  bucket: RecommendationBucket;
  schoolName: string;
  majorName?: string;
  planType: PlanType;
  city?: string;
  admissionRecord: AdmissionRecord;
  enrollmentPlan?: EnrollmentPlan;
  riskTags: string[];
  missingSources: MissingSource[];
};

export type RecommendationResult = {
  candidates: RecommendationCandidate[];
  missingSources: MissingSource[];
};
