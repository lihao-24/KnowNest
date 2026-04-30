import assert from "node:assert/strict";

import {
  getModelForAction,
  getPublicAIModelOptions,
  readAIConfig,
  readAIUsageConfig,
  readAIModelRegistry,
  resolveAIModelConfig,
} from "./config.ts";

const config = readAIConfig({
  DEEPSEEK_API_KEY: "test-key",
});

assert.deepEqual(config, {
  provider: "deepseek",
  deepseekApiKey: "test-key",
  deepseekBaseUrl: "https://api.deepseek.com",
  modelFast: "deepseek-v4-flash",
  modelDefault: "deepseek-v4-flash",
  modelQuality: "deepseek-v4-pro",
  dailyLimit: 20,
  maxInputChars: 8000,
  minInputChars: 20,
});

const customConfig = readAIConfig({
  AI_PROVIDER: "deepseek",
  DEEPSEEK_API_KEY: " custom-key ",
  DEEPSEEK_BASE_URL: " https://example.com ",
  AI_MODEL_FAST: "fast-model",
  AI_MODEL_DEFAULT: "default-model",
  AI_MODEL_QUALITY: "quality-model",
  AI_DAILY_LIMIT: "7",
  AI_MAX_INPUT_CHARS: "500",
  AI_MIN_INPUT_CHARS: "10",
});

assert.equal(customConfig.deepseekApiKey, "custom-key");
assert.equal(customConfig.deepseekBaseUrl, "https://example.com");
assert.equal(customConfig.modelFast, "fast-model");
assert.equal(customConfig.modelDefault, "default-model");
assert.equal(customConfig.modelQuality, "quality-model");
assert.equal(customConfig.dailyLimit, 7);
assert.equal(customConfig.maxInputChars, 500);
assert.equal(customConfig.minInputChars, 10);

assert.deepEqual(readAIUsageConfig({}), {
  dailyLimit: 20,
  maxInputChars: 8000,
  minInputChars: 20,
});

assert.deepEqual(
  readAIUsageConfig({
    AI_DAILY_LIMIT: "7",
    AI_MAX_INPUT_CHARS: "500",
    AI_MIN_INPUT_CHARS: "10",
  }),
  {
    dailyLimit: 7,
    maxInputChars: 500,
    minInputChars: 10,
  },
);

assert.equal(getModelForAction("generate_summary", customConfig), "fast-model");
assert.equal(getModelForAction("suggest_tags", customConfig), "fast-model");
assert.equal(getModelForAction("suggest_category", customConfig), "fast-model");
assert.equal(getModelForAction("improve_title", customConfig), "fast-model");
assert.equal(getModelForAction("organize_content", customConfig), "default-model");

assert.throws(
  () => readAIConfig({}),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "provider_not_configured" &&
    error.status === 500,
);

assert.throws(
  () =>
    readAIConfig({
      AI_PROVIDER: "openai",
      DEEPSEEK_API_KEY: "test-key",
    }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "provider_not_configured",
);

const fallbackRegistry = readAIModelRegistry({
  DEEPSEEK_API_KEY: "deepseek-key",
});

assert.equal(fallbackRegistry.defaultModelId, "deepseek-default");
assert.deepEqual(getPublicAIModelOptions(fallbackRegistry), [
  {
    id: "deepseek-default",
    label: "DeepSeek 默认",
    provider: "openai-compatible",
    model: "deepseek-v4-flash",
  },
]);

const resolvedFallbackModel = resolveAIModelConfig(
  "missing-model",
  fallbackRegistry,
  {
    DEEPSEEK_API_KEY: "deepseek-key",
  },
);

assert.deepEqual(resolvedFallbackModel, {
  id: "deepseek-default",
  label: "DeepSeek 默认",
  provider: "openai-compatible",
  apiKey: "deepseek-key",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
});

const registry = readAIModelRegistry({
  AI_DEFAULT_MODEL_ID: "xiaomi-mimo-token-plan-pro",
  DEEPSEEK_API_KEY: "deepseek-key",
  XIAOMI_MIMO_TOKEN_PLAN_API_KEY: "mimo-key",
  XIAOMI_MIMO_TOKEN_PLAN_BASE_URL: " https://token-plan-cn.xiaomimimo.com/v1 ",
  AI_MODEL_OPTIONS: JSON.stringify([
    {
      id: "deepseek-default",
      label: "DeepSeek 默认",
      provider: "openai-compatible",
      baseUrl: "https://api.deepseek.com",
      apiKeyEnv: "DEEPSEEK_API_KEY",
      model: "deepseek-v4-flash",
    },
    {
      id: "xiaomi-mimo-token-plan-pro",
      label: "Xiaomi MiMo Token Plan Pro",
      provider: "openai-compatible",
      baseUrlEnv: "XIAOMI_MIMO_TOKEN_PLAN_BASE_URL",
      apiKeyEnv: "XIAOMI_MIMO_TOKEN_PLAN_API_KEY",
      model: "mimo-v2-pro",
    },
  ]),
});

assert.equal(registry.defaultModelId, "xiaomi-mimo-token-plan-pro");
assert.deepEqual(getPublicAIModelOptions(registry), [
  {
    id: "deepseek-default",
    label: "DeepSeek 默认",
    provider: "openai-compatible",
    model: "deepseek-v4-flash",
  },
  {
    id: "xiaomi-mimo-token-plan-pro",
    label: "Xiaomi MiMo Token Plan Pro",
    provider: "openai-compatible",
    model: "mimo-v2-pro",
  },
]);

assert.deepEqual(
  resolveAIModelConfig("xiaomi-mimo-token-plan-pro", registry, {
    XIAOMI_MIMO_TOKEN_PLAN_API_KEY: "mimo-key",
    XIAOMI_MIMO_TOKEN_PLAN_BASE_URL: " https://token-plan-cn.xiaomimimo.com/v1 ",
  }),
  {
    id: "xiaomi-mimo-token-plan-pro",
    label: "Xiaomi MiMo Token Plan Pro",
    provider: "openai-compatible",
    apiKey: "mimo-key",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    model: "mimo-v2-pro",
  },
);

assert.equal(
  readAIModelRegistry({
    AI_DEFAULT_MODEL_ID: "missing-model",
    AI_MODEL_OPTIONS: JSON.stringify([
      {
        id: "deepseek-default",
        label: "DeepSeek 默认",
        provider: "openai-compatible",
        baseUrl: "https://api.deepseek.com",
        apiKeyEnv: "DEEPSEEK_API_KEY",
        model: "deepseek-v4-flash",
      },
    ]),
  }).defaultModelId,
  "deepseek-default",
);

assert.throws(
  () =>
    readAIModelRegistry({
      AI_MODEL_OPTIONS: "{bad-json",
    }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "provider_not_configured",
);

assert.throws(
  () =>
    resolveAIModelConfig("xiaomi-mimo-token-plan-pro", registry, {
      XIAOMI_MIMO_TOKEN_PLAN_API_KEY: "mimo-key",
    }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "provider_not_configured",
);

assert.throws(
  () =>
    resolveAIModelConfig("xiaomi-mimo-token-plan-pro", registry, {
      XIAOMI_MIMO_TOKEN_PLAN_BASE_URL:
        "https://token-plan-cn.xiaomimimo.com/v1",
    }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "provider_not_configured",
);
