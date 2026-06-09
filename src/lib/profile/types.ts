export type SubjectType = "物理类" | "历史类";

export type CandidateGoal =
  | "稳定"
  | "就业"
  | "考公"
  | "考研"
  | "高薪"
  | "离家近";

export type CandidateProfile = {
  province: "河南";
  score?: number;
  rank?: number;
  subjectType?: SubjectType;
  eligibleNationalSpecialPlan?: boolean;
  preferredRegions: string[];
  excludedRegions: string[];
  interestedMajors: string[];
  excludedMajors: string[];
  familyResources?: string[];
  budgetConstraints?: string[];
  primaryGoal?: CandidateGoal;
};

export type RequiredProfileField = "score" | "rank" | "subjectType" | "primaryGoal";
