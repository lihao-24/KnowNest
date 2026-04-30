import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code === "ERR_MODULE_NOT_FOUND" &&
        specifier.startsWith("@/")
      ) {
        return nextResolve(
          new URL(`../../../${specifier.slice(2)}.ts`, import.meta.url).href,
          context,
        );
      }

      if (
        error?.code === "ERR_MODULE_NOT_FOUND" &&
        (specifier.startsWith("./") || specifier.startsWith("../")) &&
        !specifier.endsWith(".ts")
      ) {
        return nextResolve(`${specifier}.ts`, context);
      }

      throw error;
    }
  },
});

const { createAIRoutePostHandler } = await import("./route.ts");

const previousEnv = {
  AI_MODEL_OPTIONS: process.env.AI_MODEL_OPTIONS,
  AI_DEFAULT_MODEL_ID: process.env.AI_DEFAULT_MODEL_ID,
  AI_MIN_INPUT_CHARS: process.env.AI_MIN_INPUT_CHARS,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  XIAOMI_MIMO_TOKEN_PLAN_API_KEY:
    process.env.XIAOMI_MIMO_TOKEN_PLAN_API_KEY,
  XIAOMI_MIMO_TOKEN_PLAN_BASE_URL:
    process.env.XIAOMI_MIMO_TOKEN_PLAN_BASE_URL,
};

try {
  delete process.env.DEEPSEEK_API_KEY;
  process.env.AI_DEFAULT_MODEL_ID = "xiaomi-mimo-token-plan-pro";
  process.env.AI_MIN_INPUT_CHARS = "1";
  process.env.AI_MODEL_OPTIONS = JSON.stringify([
    {
      id: "xiaomi-mimo-token-plan-pro",
      label: "小米 MIMO Token Plan Pro",
      provider: "openai-compatible",
      apiKeyEnv: "XIAOMI_MIMO_TOKEN_PLAN_API_KEY",
      baseUrlEnv: "XIAOMI_MIMO_TOKEN_PLAN_BASE_URL",
      model: "mimo-v2-pro",
    },
  ]);
  process.env.XIAOMI_MIMO_TOKEN_PLAN_API_KEY = "mimo-key";
  process.env.XIAOMI_MIMO_TOKEN_PLAN_BASE_URL =
    "https://token-plan-cn.xiaomimimo.com/v1";

  const providerCalls = [];
  const usageLogs = [];
  const post = createAIRoutePostHandler({
    requireUser: async () => ({ id: "user-1", email: "user@example.com" }),
    buildAIGenerateContext: async () => ({
      action: "generate_summary",
      knowledgeItemId: "item-1",
      title: "标题",
      content: "正文",
      existingTags: [],
      existingCategories: [],
    }),
    countTodayAIUsage: async () => 0,
    createAIUsageLog: async (input) => {
      usageLogs.push(input);
    },
    createAIProvider: (config) => ({
      async generate(params) {
        providerCalls.push({ config, params });
        return { summary: "测试摘要" };
      },
    }),
  });

  const response = await post(
    new Request("http://localhost/api/ai", {
      method: "POST",
      body: JSON.stringify({
        action: "generate_summary",
        knowledgeItemId: "item-1",
        modelId: "xiaomi-mimo-token-plan-pro",
      }),
    }),
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    ok: true,
    result: { summary: "测试摘要" },
  });
  assert.equal(providerCalls.length, 1);
  assert.equal(providerCalls[0].config.id, "xiaomi-mimo-token-plan-pro");
  assert.equal(providerCalls[0].config.apiKey, "mimo-key");
  assert.equal(
    providerCalls[0].config.baseUrl,
    "https://token-plan-cn.xiaomimimo.com/v1",
  );
  assert.equal(providerCalls[0].params.model, "mimo-v2-pro");
  assert.equal(usageLogs.length, 1);
  assert.equal(
    usageLogs[0].model,
    "xiaomi-mimo-token-plan-pro:mimo-v2-pro",
  );
  assert.equal(usageLogs[0].status, "success");
} finally {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
