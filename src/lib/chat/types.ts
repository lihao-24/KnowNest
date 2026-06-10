import type { AdmissionRecord, EnrollmentPlan } from "@/lib/admissions/types";
import type { CandidateProfile as ExtractedProfile } from "@/lib/profile/types";

export type SubjectType = "物理类" | "历史类";

export type StatusKind = "数据未导入" | "资料未全" | "待确认" | "待核验" | "可用";

export type CandidateBucket = "冲" | "稳" | "保";

export type CandidateProfile = {
  province: "河南";
  score: number | null;
  rank: number | null;
  subjectType: SubjectType | null;
  eligibleNationalSpecialPlan: boolean | null;
  preferredRegions: string[];
  interestedMajors: string[];
  primaryGoal: string | null;
};

export type VolunteerCandidate = {
  id: string;
  bucket: CandidateBucket;
  schoolName: string;
  majorName: string;
  planType: "普通本科批" | "国家专项计划";
  subjectType: SubjectType;
  city: string;
  evidence: string;
  riskTags: string[];
  status: StatusKind;
};

export type DataSourceSummary = {
  id: string;
  title: string;
  trustLevel: "T1" | "T2" | "T3" | "T4" | "T5";
  status: StatusKind;
  detail: string;
};

export type ChatSummary = {
  status: StatusKind;
  profile: CandidateProfile;
  missingInfo: string[];
  candidates: VolunteerCandidate[];
  sources: DataSourceSummary[];
  verificationItems: string[];
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  title: string;
  updatedAt: string;
  status: StatusKind;
  preview: string;
};

export type ChatOrchestratorInput = {
  message: string;
  userId: string;
  sessionId?: string;
  admissionRecords?: AdmissionRecord[];
  enrollmentPlans?: EnrollmentPlan[];
  existingProfile?: ExtractedProfile | null;
};

export type ChatOrchestratorResult = {
  assistantMessage: ChatMessage;
  summary: ChatSummary;
  sessions: ChatSession[];
};
