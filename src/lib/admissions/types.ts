import type { SubjectType } from "@/lib/profile/types";

export type PlanType = "普通本科批" | "国家专项计划";
export type Batch = "本科批";
export type TrustLevel = "T1" | "T2" | "T3" | "T4" | "T5";

export type AdmissionRecord = {
  id?: string;
  year: number;
  province: string;
  batch: Batch;
  planType: PlanType;
  subjectType: SubjectType;
  schoolCode: string;
  schoolName: string;
  majorGroupCode?: string;
  majorGroupName?: string;
  majorCode?: string;
  majorName?: string;
  minScore?: number;
  minRank?: number;
  avgScore?: number;
  avgRank?: number;
  planCount?: number;
  sourceName: string;
  sourceUrl?: string;
  sourcePublishedAt?: string;
  trustLevel: TrustLevel;
  importedAt?: string;
  notes?: string;
};

export type EnrollmentPlan = {
  id?: string;
  year: number;
  province: string;
  batch: Batch;
  planType: PlanType;
  subjectType: SubjectType;
  schoolCode: string;
  schoolName: string;
  majorGroupCode?: string;
  majorGroupName?: string;
  majorCode?: string;
  majorName?: string;
  planCount: number;
  tuition?: string;
  duration?: string;
  campus?: string;
  requirements?: string;
  sourceName: string;
  sourceUrl?: string;
  sourcePublishedAt?: string;
  trustLevel: TrustLevel;
  importedAt?: string;
  notes?: string;
};

export type ScoreSegment = {
  id?: string;
  year: number;
  province: string;
  subjectType: SubjectType;
  score: number;
  sameScoreCount: number;
  cumulativeCount: number;
  sourceName: string;
  sourceUrl?: string;
  sourcePublishedAt?: string;
  trustLevel: TrustLevel;
  importedAt?: string;
  notes?: string;
};

export type AdmissionImportError = {
  row: number;
  field: string;
  message: string;
};

export type AdmissionImportResult = {
  records: AdmissionRecord[];
  errors: AdmissionImportError[];
};

export type EnrollmentPlanImportResult = {
  plans: EnrollmentPlan[];
  errors: AdmissionImportError[];
};

export type ScoreSegmentImportResult = {
  segments: ScoreSegment[];
  errors: AdmissionImportError[];
};
