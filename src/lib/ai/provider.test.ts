import { afterEach, describe, expect, it } from "vitest";
import { generateAssistantText } from "./provider";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("generateAssistantText", () => {
  it("does not expose internal orchestration terms in demo replies", async () => {
    process.env.AI_DEFAULT_PROVIDER = "";
    process.env.AI_PROVIDER_BASE_URL = "";
    process.env.AI_PROVIDER_API_KEY = "";
    process.env.AI_PROVIDER_MODEL = "";

    const result = await generateAssistantText({
      userMessage: "河南理科580",
      systemContext:
        "现在不能做完整冲稳保判断，还缺：全省位次、核心诉求。当前使用数据库招生记录，仍需核验官方来源和当年计划。"
    });

    expect(result.provider).toBe("demo");
    expect(result.content).toContain("现在还不能直接给冲稳保方案");
    expect(result.content).toContain("全省位次");
    expect(result.content).toContain("核心诉求");
    expect(result.content).not.toMatch(/MVP|服务端边界|规则层|admission_records|数据库招生记录/);
  });

  it("detects openai-compatible provider from base url, api key and model", async () => {
    process.env.AI_DEFAULT_PROVIDER = "openai-compatible";
    process.env.AI_PROVIDER_BASE_URL = "https://api.example.test/v1";
    process.env.AI_PROVIDER_API_KEY = "test-key";
    process.env.AI_PROVIDER_MODEL = "test-model";

    const result = await generateAssistantText({
      userMessage: "河南理科580",
      systemContext: "现在不能做完整冲稳保判断，还缺：全省位次。"
    });

    expect(result.provider).toBe("openai-compatible");
  });
});
