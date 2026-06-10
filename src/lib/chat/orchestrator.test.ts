import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EnrollmentPlan } from "@/lib/admissions/types";
import {
  getCandidateProfileForSession,
  getLatestCandidateProfileForUser,
  persistChatTurn
} from "@/lib/db/chat-repository";
import { runChatOrchestrator } from "./orchestrator";

vi.mock("@/lib/db/chat-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db/chat-repository")>();

  return {
    ...actual,
    getCandidateProfileForSession: vi.fn(actual.getCandidateProfileForSession),
    getLatestCandidateProfileForUser: vi.fn(actual.getLatestCandidateProfileForUser),
    persistChatTurn: vi.fn(actual.persistChatTurn)
  };
});

const mockedGetCandidateProfileForSession = vi.mocked(getCandidateProfileForSession);
const mockedGetLatestCandidateProfileForUser = vi.mocked(getLatestCandidateProfileForUser);
const mockedPersistChatTurn = vi.mocked(persistChatTurn);

const matchingEnrollmentPlans: EnrollmentPlan[] = [
  {
    id: "sample-plan",
    year: 2026,
    province: "河南",
    batch: "本科批",
    planType: "普通本科批",
    subjectType: "物理类",
    schoolCode: "S002",
    schoolName: "黄河样例学院",
    majorCode: "080601",
    majorName: "电气工程及其自动化",
    planCount: 60,
    sourceName: "河南省教育考试院",
    trustLevel: "T1"
  }
];

describe("runChatOrchestrator", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "disabled";
    vi.clearAllMocks();
  });

  it("normalizes colloquial subject type and asks for missing rank", async () => {
    const result = await runChatOrchestrator({
      message: "河南理科 580 分，想省内稳一点",
      userId: "demo-user"
    });

    expect(result.summary.profile.subjectType).toBe("物理类");
    expect(result.summary.profile.score).toBe(580);
    expect(result.summary.missingInfo).toContain("全省位次");
    expect(result.summary.status).toBe("资料未全");
    expect(result.assistantMessage.content).toContain("现在还不能直接给冲稳保方案");
    expect(result.assistantMessage.content).toContain("全省位次");
    expect(result.assistantMessage.content).not.toMatch(/MVP|服务端边界|规则层|admission_records/);
  });

  it("asks for official subject type when subject type is missing", async () => {
    const result = await runChatOrchestrator({
      message: "河南 580 分，位次 3 万，想省内稳一点",
      userId: "demo-user"
    });

    expect(result.summary.missingInfo).toContain("科类：物理类或历史类");
    expect(result.summary.status).toBe("资料未全");
    expect(result.assistantMessage.content).toContain("物理类或历史类");
  });

  it("builds recommendation summary from sample admissions records when profile is complete", async () => {
    const result = await runChatOrchestrator({
      message: "河南理科 580 分，位次 3 万，没有国家专项资格，想省内稳一点",
      userId: "demo-user"
    });

    expect(result.summary.profile.subjectType).toBe("物理类");
    expect(result.summary.profile.rank).toBe(30000);
    expect(result.summary.missingInfo).not.toContain("全省位次");
    expect(result.summary.status).toBe("待核验");
    expect(result.summary.candidates.map((candidate) => candidate.bucket)).toEqual(
      expect.arrayContaining(["冲", "稳", "保"])
    );
    expect(result.summary.candidates.map((candidate) => candidate.planType)).not.toContain(
      "国家专项计划"
    );
    expect(result.summary.sources[0].detail).toContain("样例数据，不用于真实填报");
    expect(result.assistantMessage.content).toContain("初筛方向");
    expect(result.assistantMessage.content).toContain("不是最终填报结论");
    expect(result.assistantMessage.content).not.toMatch(/MVP|服务端边界|规则层|admission_records/);
  });

  it("does not fabricate candidates when no admissions data is available", async () => {
    const result = await runChatOrchestrator({
      message: "河南理科 580 分，位次 3 万，没有国家专项资格，想省内稳一点",
      userId: "demo-user",
      admissionRecords: []
    });

    expect(result.summary.candidates).toEqual([]);
    expect(result.summary.status).toBe("数据未导入");
    expect(result.summary.sources[0].detail).toContain("数据未导入");
    expect(result.assistantMessage.content).toContain("不能生成真实冲稳保候选");
    expect(result.assistantMessage.content).toContain("结构化招生数据还没有导入");
    expect(result.assistantMessage.content).not.toMatch(/MVP|服务端边界|规则层|admission_records/);
  });

  it("merges the latest message into the existing profile before judging missing fields", async () => {
    const result = await runChatOrchestrator({
      message: "位次2万，稳妥，想从事计算机行业，希望考研",
      userId: "demo-user",
      admissionRecords: [],
      existingProfile: {
        province: "河南",
        score: 580,
        subjectType: "物理类",
        preferredRegions: [],
        excludedRegions: [],
        interestedMajors: [],
        excludedMajors: []
      }
    });

    expect(result.summary.profile.score).toBe(580);
    expect(result.summary.profile.subjectType).toBe("物理类");
    expect(result.summary.profile.rank).toBe(20000);
    expect(result.summary.profile.interestedMajors).toContain("计算机");
    expect(result.summary.profile.primaryGoal).toBe("稳定");
    expect(result.summary.missingInfo).toEqual(["结构化招生数据"]);
    expect(result.assistantMessage.content).toContain("计算机");
    expect(result.assistantMessage.content).toContain("考研");
    expect(result.assistantMessage.content).not.toMatch(/高考分数|科类：物理类或历史类/);
  });

  it("uses enrollment plans to reduce missing source warnings in recommendation summary", async () => {
    const result = await runChatOrchestrator({
      message: "河南理科 580 分，位次 3 万，没有国家专项资格，想省内稳一点",
      userId: "demo-user",
      enrollmentPlans: matchingEnrollmentPlans
    });

    const matchedCandidate = result.summary.candidates.find(
      (candidate) => candidate.schoolName === "黄河样例学院"
    );

    expect(matchedCandidate?.riskTags).toContain("当年招生计划减少");
    expect(matchedCandidate?.status).toBe("可用");
    expect(matchedCandidate?.evidence).toContain("当年计划 60 人");
    expect(result.summary.sources.map((source) => source.id)).toContain("enrollment-plans-sample");
    expect(result.summary.sources.find((source) => source.id === "enrollment-plans-sample")?.detail).toContain(
      "已匹配 1 条当年招生计划"
    );
  });

  it("continues from the requested session profile instead of the latest user profile", async () => {
    mockedGetCandidateProfileForSession.mockResolvedValueOnce({
      province: "河南",
      score: 580,
      subjectType: "物理类",
      preferredRegions: [],
      excludedRegions: [],
      interestedMajors: [],
      excludedMajors: []
    });
    mockedGetLatestCandidateProfileForUser.mockResolvedValueOnce({
      province: "河南",
      score: 610,
      subjectType: "历史类",
      preferredRegions: [],
      excludedRegions: [],
      interestedMajors: [],
      excludedMajors: []
    });

    const result = await runChatOrchestrator({
      message: "位次 3 万，想省内稳一点",
      userId: "demo-user",
      sessionId: "session-old",
      admissionRecords: []
    });

    expect(mockedGetCandidateProfileForSession).toHaveBeenCalledWith("demo-user", "session-old");
    expect(mockedGetLatestCandidateProfileForUser).not.toHaveBeenCalled();
    expect(result.summary.profile.score).toBe(580);
    expect(result.summary.profile.subjectType).toBe("物理类");
    expect(result.summary.profile.rank).toBe(30000);
    expect(mockedPersistChatTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "demo-user",
        sessionId: "session-old",
        profile: expect.objectContaining({
          score: 580,
          subjectType: "物理类",
          rank: 30000
        })
      })
    );
  });
});
