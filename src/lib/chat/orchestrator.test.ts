import { describe, expect, it } from "vitest";
import { runChatOrchestrator } from "./orchestrator";

describe("runChatOrchestrator", () => {
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
});
