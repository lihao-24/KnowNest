import assert from "node:assert/strict";

import {
  getSettingsViewModel,
  SETTINGS_LOGOUT_BUTTON_MIN_HEIGHT_CLASS,
} from "./settings-model.ts";

const settings = getSettingsViewModel({
  id: "user-1",
  email: "user@example.com",
}, {
  defaultModelId: "deepseek-default",
  modelOptions: [
    {
      id: "deepseek-default",
      label: "DeepSeek 默认",
      provider: "openai-compatible",
      model: "deepseek-v4-flash",
      apiKeyEnv: "DEEPSEEK_API_KEY",
      baseUrl: "https://api.deepseek.com",
    },
    {
      id: "xiaomi-mimo-token-plan-pro",
      label: "Xiaomi MiMo Token Plan Pro",
      provider: "openai-compatible",
      model: "mimo-v2-pro",
      apiKeyEnv: "XIAOMI_MIMO_TOKEN_PLAN_API_KEY",
      baseUrlEnv: "XIAOMI_MIMO_TOKEN_PLAN_BASE_URL",
    },
  ],
});

assert.equal(settings.accountEmail, "user@example.com");
assert.equal(settings.appVersion, "V0.1");
assert.equal(settings.logoutButtonLabel, "退出登录");
assert.equal(settings.logoutPendingLabel, "退出中...");
assert.equal(settings.logoutButtonMinHeightClass, "h-11");
assert.equal(SETTINGS_LOGOUT_BUTTON_MIN_HEIGHT_CLASS, "h-11");
assert.equal(settings.ai.defaultModelId, "deepseek-default");
assert.deepEqual(settings.ai.modelOptions, [
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
assert.equal(JSON.stringify(settings.ai).includes("apiKey"), false);
assert.equal(JSON.stringify(settings.ai).includes("apiKeyEnv"), false);
assert.equal(JSON.stringify(settings.ai).includes("baseUrl"), false);

const settingsWithoutEmail = getSettingsViewModel({
  id: "user-2",
  email: null,
}, {
  defaultModelId: "",
  modelOptions: [],
});

assert.equal(settingsWithoutEmail.accountEmail, "邮箱未提供");
assert.equal(settingsWithoutEmail.ai.defaultModelId, "");
assert.deepEqual(settingsWithoutEmail.ai.modelOptions, []);
