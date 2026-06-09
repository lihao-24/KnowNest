import { beforeEach, describe, expect, it } from "vitest";
import { runChatOrchestrator } from "./orchestrator";

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
  });

  it("does not fabricate candidates when no admissions data is available", async () => {
    const result = await runChatOrchestrator({
      message: "河南理科 580 分，位次 3 万，没有国家专项资格，想省内稳一点",
      userId: "demo-user",
      admissionRecords: []
    });

    expect(result.summary.candidates).toEqual([]);
    expect(result.summary.status).toBe("资料未全");
    expect(result.summary.sources[0].detail).toContain("数据未导入");
    expect(result.assistantMessage.content).toContain("数据未导入");
  });
});
