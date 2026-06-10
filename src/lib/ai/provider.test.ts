import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAssistantText } from "./provider";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "请补充全省位次。"
              }
            }
          ]
        })
      })
    );

    const result = await generateAssistantText({
      userMessage: "河南理科580",
      systemContext: "现在不能做完整冲稳保判断，还缺：全省位次。",
      grounding: {
        dataMode: "database",
        summary: {
          status: "资料未全",
          profile: {
            province: "河南",
            score: 580,
            rank: null,
            subjectType: "物理类",
            eligibleNationalSpecialPlan: null,
            preferredRegions: [],
            interestedMajors: [],
            primaryGoal: null
          },
          missingInfo: ["全省位次"],
          candidates: [],
          sources: [],
          verificationItems: []
        }
      }
    });

    expect(result.provider).toBe("openai-compatible");
  });

  it("calls openai-compatible chat completions with grounded summary context", async () => {
    process.env.AI_DEFAULT_PROVIDER = "openai-compatible";
    process.env.AI_PROVIDER_BASE_URL = "https://api.example.test/v1";
    process.env.AI_PROVIDER_API_KEY = "test-key";
    process.env.AI_PROVIDER_MODEL = "test-model";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "黄河样例学院可以作为稳妥候选，但仍要核验当年计划。"
            }
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateAssistantText({
      userMessage: "河南理科580，位次3万，想稳一点",
      systemContext:
        "规则层已基于 admission_records 生成候选：冲 0 个、稳 1 个、保 0 个。当前使用样例数据，不用于真实填报。",
      grounding: {
        dataMode: "sample",
        summary: {
          status: "待核验",
          profile: {
            province: "河南",
            score: 580,
            rank: 30000,
            subjectType: "物理类",
            eligibleNationalSpecialPlan: false,
            preferredRegions: [],
            interestedMajors: ["电气"],
            primaryGoal: "稳定"
          },
          missingInfo: [],
          candidates: [
            {
              id: "candidate-1",
              bucket: "稳",
              schoolName: "黄河样例学院",
              majorName: "电气工程及其自动化",
              planType: "普通本科批",
              subjectType: "物理类",
              city: "郑州",
              evidence:
                "2025 年河南本科批普通本科批记录：最低分 575，最低位次 32000。来源：河南省教育考试院。",
              riskTags: ["当前为样例数据"],
              status: "待核验"
            }
          ],
          sources: [
            {
              id: "admission-records-sample",
              title: "admission_records 样例 CSV",
              trustLevel: "T5",
              status: "待核验",
              detail: "已加载 12 条样例数据，不用于真实填报；仅用于验证端到端推荐闭环。"
            }
          ],
          verificationItems: ["当前为样例数据，不用于真实填报。"]
        }
      }
    });

    expect(result.provider).toBe("openai-compatible");
    expect(result.content).toContain("黄河样例学院");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key"
        })
      })
    );

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request.model).toBe("test-model");
    expect(JSON.stringify(request.messages)).toContain("黄河样例学院");
    expect(JSON.stringify(request.messages)).toContain("最低位次 32000");
    expect(JSON.stringify(request.messages)).toContain("不得新增候选");
    expect(JSON.stringify(request.messages)).toContain("不得编造学校、专业、分数、位次或计划数");
    expect(JSON.stringify(request.messages)).toContain("样例数据，不用于真实填报");
  });

  it("falls back to safe text when provider invents a school outside grounded candidates", async () => {
    process.env.AI_DEFAULT_PROVIDER = "openai-compatible";
    process.env.AI_PROVIDER_BASE_URL = "https://api.example.test/v1";
    process.env.AI_PROVIDER_API_KEY = "test-key";
    process.env.AI_PROVIDER_MODEL = "test-model";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "建议把虚构大学作为稳妥保底，分数线很合适。"
              }
            }
          ]
        })
      })
    );

    const result = await generateAssistantText({
      userMessage: "河南理科580，位次3万，想稳一点",
      systemContext:
        "规则层已基于 admission_records 生成候选：冲 0 个、稳 1 个、保 0 个。当前使用样例数据，不用于真实填报。",
      grounding: {
        dataMode: "sample",
        summary: {
          status: "待核验",
          profile: {
            province: "河南",
            score: 580,
            rank: 30000,
            subjectType: "物理类",
            eligibleNationalSpecialPlan: false,
            preferredRegions: [],
            interestedMajors: [],
            primaryGoal: "稳定"
          },
          missingInfo: [],
          candidates: [
            {
              id: "candidate-1",
              bucket: "稳",
              schoolName: "黄河样例学院",
              majorName: "电气工程及其自动化",
              planType: "普通本科批",
              subjectType: "物理类",
              city: "郑州",
              evidence:
                "2025 年河南本科批普通本科批记录：最低分 575，最低位次 32000。来源：河南省教育考试院。",
              riskTags: [],
              status: "待核验"
            }
          ],
          sources: [],
          verificationItems: []
        }
      }
    });

    expect(result.provider).toBe("demo");
    expect(result.content).not.toContain("虚构大学");
    expect(result.content).toContain("不会凭感觉编学校");
  });
});
