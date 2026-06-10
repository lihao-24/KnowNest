import type {
  CandidateProfile,
  ChatSession,
  ChatSummary,
  DataSourceSummary,
  VolunteerCandidate
} from "./types";
import type { CandidateProfile as ExtractedProfile } from "@/lib/profile/types";

export const emptyProfile: CandidateProfile = {
  province: "河南",
  score: null,
  rank: null,
  subjectType: null,
  eligibleNationalSpecialPlan: null,
  preferredRegions: [],
  interestedMajors: [],
  primaryGoal: null
};

export const demoSessions: ChatSession[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    title: "河南物理类 580 分咨询",
    updatedAt: "刚刚",
    status: "资料未全",
    preview: "缺位次和国家专项资格，先补硬信息。"
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    title: "省内稳妥方案",
    updatedAt: "昨天",
    status: "待核验",
    preview: "候选需要回查招生章程和当年计划。"
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    title: "计算机 vs 电气",
    updatedAt: "6 月 8 日",
    status: "待确认",
    preview: "偏就业，需要确认城市和家庭预算。"
  }
];

export const demoCandidates: VolunteerCandidate[] = [
  {
    id: "candidate-rush-1",
    bucket: "冲",
    schoolName: "郑州大学",
    majorName: "电子信息类",
    planType: "普通本科批",
    subjectType: "物理类",
    city: "郑州",
    evidence: "示例边界：需接入近三年河南本科批投档位次后才能判断。",
    riskTags: ["位次波动待核验", "专业热度高"],
    status: "待核验"
  },
  {
    id: "candidate-stable-1",
    bucket: "稳",
    schoolName: "河南大学",
    majorName: "自动化",
    planType: "普通本科批",
    subjectType: "物理类",
    city: "开封",
    evidence: "示例边界：等待 admission_records 与 enrollment_plans 接入。",
    riskTags: ["计划数待确认"],
    status: "待核验"
  },
  {
    id: "candidate-safe-1",
    bucket: "保",
    schoolName: "河南理工大学",
    majorName: "电气工程及其自动化",
    planType: "普通本科批",
    subjectType: "物理类",
    city: "焦作",
    evidence: "示例边界：可作为 UI 展示占位，不能作为真实推荐。",
    riskTags: ["章程限制待核验"],
    status: "待核验"
  }
];

export const demoSources: DataSourceSummary[] = [
  {
    id: "source-t1",
    title: "河南省教育考试院近三年投档数据",
    trustLevel: "T1",
    status: "待核验",
    detail: "结构化数据尚未导入，当前只保留服务端接口边界。"
  },
  {
    id: "source-t2",
    title: "高校招生章程与当年招生计划",
    trustLevel: "T2",
    status: "待核验",
    detail: "后续由数据层返回专业限制、计划数、学费和校区。"
  },
  {
    id: "source-t4",
    title: "冲稳保经验方法",
    trustLevel: "T4",
    status: "可用",
    detail: "只能用于解释取舍，不能替代真实位次和计划数据。"
  }
];

export function createSummary(profile: CandidateProfile): ChatSummary {
  const missingInfo: string[] = [];

  if (profile.score === null) missingInfo.push("高考分数");
  if (profile.rank === null) missingInfo.push("全省位次");
  if (profile.subjectType === null) missingInfo.push("科类：物理类或历史类");
  if (profile.primaryGoal === null) missingInfo.push("核心诉求：稳妥、就业、考研、城市等");
  if (profile.eligibleNationalSpecialPlan === null) {
    missingInfo.push("是否具备国家专项计划资格");
  }

  const completeEnoughForDemo =
    profile.score !== null &&
    profile.rank !== null &&
    profile.subjectType !== null &&
    profile.primaryGoal !== null;

  return {
    status: completeEnoughForDemo ? "待核验" : "资料未全",
    profile,
    missingInfo,
    candidates: completeEnoughForDemo ? demoCandidates : [],
    sources: demoSources,
    verificationItems: [
      "用河南省教育考试院官方数据核对近三年最低位次。",
      "回查高校招生章程中的体检、单科、外语语种和调剂规则。",
      "确认当年招生计划、校区、学费和专业名称是否变化。"
    ]
  };
}

export function toChatProfile(profile: ExtractedProfile): CandidateProfile {
  return {
    province: "河南",
    score: profile.score ?? null,
    rank: profile.rank ?? null,
    subjectType: profile.subjectType ?? null,
    eligibleNationalSpecialPlan: profile.eligibleNationalSpecialPlan ?? null,
    preferredRegions: profile.preferredRegions,
    interestedMajors: profile.interestedMajors,
    primaryGoal: profile.primaryGoal ?? null
  };
}
