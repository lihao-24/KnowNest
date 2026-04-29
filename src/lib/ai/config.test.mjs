import assert from "node:assert/strict";

import { getModelForAction, readAIConfig } from "./config.ts";

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
