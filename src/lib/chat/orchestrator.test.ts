import { beforeEach, describe, expect, it } from "vitest";
import type { EnrollmentPlan } from "@/lib/admissions/types";
import { runChatOrchestrator } from "./orchestrator";

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
    expect(result.assistantMessage.content).toContain("不会编具体录取线或计划数");
    expect(result.assistantMessage.content).toContain("全省位次");
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
    expect(result.assistantMessage.content).toContain("样例数据，不用于真实填报");
    expect(result.assistantMessage.content).not.toContain("结构化招生数据还没有导入");
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
    expect(result.assistantMessage.content).toContain("数据未导入");
    expect(result.assistantMessage.content).toContain("先导入 admission_records");
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
    expect(result.summary.sources.map((source) => source.id)).toContain("enrollment-plans-sample");
    expect(result.summary.sources.find((source) => source.id === "enrollment-plans-sample")?.detail).toContain(
      "已匹配 1 条当年招生计划"
    );
  });
});
