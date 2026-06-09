import type { CandidateGoal, CandidateProfile, RequiredProfileField, SubjectType } from "./types";

const goalPatterns: Array<{ goal: CandidateGoal; patterns: RegExp[] }> = [
  { goal: "稳定", patterns: [/稳一点/, /稳定/, /稳妥/, /保守/] },
  { goal: "就业", patterns: [/就业/, /好找工作/, /工作/, /挣钱/] },
  { goal: "考公", patterns: [/考公/, /公务员/, /体制内/, /编制/] },
  { goal: "考研", patterns: [/考研/, /升学/, /读研/] },
  { goal: "高薪", patterns: [/高薪/, /薪资/, /工资高/] },
  { goal: "离家近", patterns: [/离家近/, /离家近点/, /离家不要太远/] }
];

const majorKeywords = [
  "计算机",
  "软件",
  "人工智能",
  "电气",
  "电子",
  "临床",
  "口腔",
  "法学",
  "汉语言",
  "师范",
  "会计",
  "金融",
  "护理",
  "机械",
  "自动化"
];

export function normalizeSubjectType(input: string): SubjectType | undefined {
  if (/物理类|理科|物理方向|选物理/.test(input)) {
    return "物理类";
  }

  if (/历史类|文科|历史方向|选历史/.test(input)) {
    return "历史类";
  }

  return undefined;
}

export function extractProfileFromMessage(message: string): CandidateProfile {
  const normalizedMessage = message.replace(/\s+/g, " ").trim();
  const profile: CandidateProfile = {
    province: "河南",
    preferredRegions: [],
    excludedRegions: [],
    interestedMajors: [],
    excludedMajors: []
  };

  const score = extractScore(normalizedMessage);
  if (score !== undefined) {
    profile.score = score;
  }

  const rank = extractRank(normalizedMessage);
  if (rank !== undefined) {
    profile.rank = rank;
  }

  const subjectType = normalizeSubjectType(normalizedMessage);
  if (subjectType) {
    profile.subjectType = subjectType;
  }

  const nationalSpecialEligibility = extractNationalSpecialEligibility(normalizedMessage);
  if (nationalSpecialEligibility !== undefined) {
    profile.eligibleNationalSpecialPlan = nationalSpecialEligibility;
  }

  profile.preferredRegions = extractPreferredRegions(normalizedMessage);
  profile.excludedRegions = extractExcludedRegions(normalizedMessage);
  profile.interestedMajors = extractInterestedMajors(normalizedMessage);
  profile.excludedMajors = extractExcludedMajors(normalizedMessage);

  const primaryGoal = extractPrimaryGoal(normalizedMessage);
  if (primaryGoal) {
    profile.primaryGoal = primaryGoal;
  }

  const familyResources = extractFamilyResources(normalizedMessage);
  if (familyResources.length > 0) {
    profile.familyResources = familyResources;
  }

  const budgetConstraints = extractBudgetConstraints(normalizedMessage);
  if (budgetConstraints.length > 0) {
    profile.budgetConstraints = budgetConstraints;
  }

  return profile;
}

export function getMissingProfileFields(profile: CandidateProfile): RequiredProfileField[] {
  const missingFields: RequiredProfileField[] = [];

  if (profile.score === undefined) {
    missingFields.push("score");
  }

  if (profile.rank === undefined) {
    missingFields.push("rank");
  }

  if (!profile.subjectType) {
    missingFields.push("subjectType");
  }

  if (!profile.primaryGoal) {
    missingFields.push("primaryGoal");
  }

  return missingFields;
}

function extractScore(message: string): number | undefined {
  const match = message.match(/(?:^|[^\d])(\d{3})(?:\s*)分/);
  if (!match) {
    return undefined;
  }

  return Number(match[1]);
}

function extractRank(message: string): number | undefined {
  const rankMatch = message.match(/(?:位次|排名|排位|全省)\s*([0-9]+(?:\.[0-9]+)?)\s*(万|千)?/);
  if (!rankMatch) {
    return undefined;
  }

  const base = Number(rankMatch[1]);
  if (!Number.isFinite(base)) {
    return undefined;
  }

  if (rankMatch[2] === "万") {
    return Math.round(base * 10000);
  }

  if (rankMatch[2] === "千") {
    return Math.round(base * 1000);
  }

  return Math.round(base);
}

function extractNationalSpecialEligibility(message: string): boolean | undefined {
  if (/没有国家专项|无国家专项|不符合国家专项|没有专项资格|无专项资格/.test(message)) {
    return false;
  }

  if (/国家专项|专项资格|专项计划/.test(message)) {
    return true;
  }

  return undefined;
}

function extractPrimaryGoal(message: string): CandidateGoal | undefined {
  return goalPatterns.find(({ patterns }) => patterns.some((pattern) => pattern.test(message)))?.goal;
}

function extractPreferredRegions(message: string): string[] {
  const regions = new Set<string>();

  if (/省内|河南/.test(message)) {
    regions.add("河南");
  }

  if (/郑州/.test(message)) {
    regions.add("郑州");
  }

  if (/洛阳/.test(message)) {
    regions.add("洛阳");
  }

  if (/省外/.test(message)) {
    regions.add("省外");
  }

  return [...regions];
}

function extractExcludedRegions(message: string): string[] {
  const regions = new Set<string>();
  const negativeRegionMatch = message.match(/不(?:想|考虑|去|接受)([^，。,.]*)/);

  if (negativeRegionMatch?.[1]) {
    if (/省外/.test(negativeRegionMatch[1])) {
      regions.add("省外");
    }
    if (/省内|河南/.test(negativeRegionMatch[1])) {
      regions.add("河南");
    }
    if (/郑州/.test(negativeRegionMatch[1])) {
      regions.add("郑州");
    }
  }

  return [...regions];
}

function extractInterestedMajors(message: string): string[] {
  return majorKeywords.filter((major) => message.includes(major));
}

function extractExcludedMajors(message: string): string[] {
  const negativePart = message.match(/不(?:想|考虑|学|接受)([^，。,.]*)/)?.[1] ?? "";
  return majorKeywords.filter((major) => negativePart.includes(major));
}

function extractFamilyResources(message: string): string[] {
  const resources: string[] = [];

  if (/家里有资源|家庭资源|有人脉/.test(message)) {
    resources.push("家庭资源");
  }

  if (/普通家庭|没资源|没有资源/.test(message)) {
    resources.push("普通家庭");
  }

  return resources;
}

function extractBudgetConstraints(message: string): string[] {
  const constraints: string[] = [];

  if (/学费|预算|中外合作|较高收费/.test(message)) {
    constraints.push("关注学费");
  }

  return constraints;
}
