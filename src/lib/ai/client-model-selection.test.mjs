import assert from "node:assert/strict";

import {
  AI_MODEL_SELECTION_STORAGE_KEY,
  clearStoredAIModelId,
  getStoredAIModelId,
  resolveSelectedAIModelId,
  setStoredAIModelId,
} from "./client-model-selection.ts";

const options = [
  {
    id: "deepseek-default",
    label: "DeepSeek Default",
    provider: "openai-compatible",
    model: "deepseek-v4-flash",
  },
  {
    id: "xiaomi-mimo-token-plan-pro",
    label: "Xiaomi MiMo Token Plan Pro",
    provider: "openai-compatible",
    model: "mimo-v2-pro",
  },
];

assert.equal(AI_MODEL_SELECTION_STORAGE_KEY, "knownest.ai.modelId");

assert.equal(
  resolveSelectedAIModelId(
    options,
    "deepseek-default",
    "xiaomi-mimo-token-plan-pro",
  ),
  "xiaomi-mimo-token-plan-pro",
);

assert.equal(
  resolveSelectedAIModelId(options, "deepseek-default", "missing-model"),
  "deepseek-default",
);

assert.equal(
  resolveSelectedAIModelId(options, "missing-default", "missing-model"),
  "deepseek-default",
);

assert.equal(resolveSelectedAIModelId([], "deepseek-default", "deepseek-default"), "");

const originalLocalStorage = globalThis.localStorage;

const store = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  },
});

setStoredAIModelId("  xiaomi-mimo-token-plan-pro  ");
assert.equal(
  store.get(AI_MODEL_SELECTION_STORAGE_KEY),
  "xiaomi-mimo-token-plan-pro",
);
assert.equal(getStoredAIModelId(), "xiaomi-mimo-token-plan-pro");

setStoredAIModelId("   ");
assert.equal(
  store.get(AI_MODEL_SELECTION_STORAGE_KEY),
  "xiaomi-mimo-token-plan-pro",
);

clearStoredAIModelId();
assert.equal(getStoredAIModelId(), null);

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: undefined,
});

assert.equal(getStoredAIModelId(), null);
assert.doesNotThrow(() => setStoredAIModelId("deepseek-default"));
assert.doesNotThrow(() => clearStoredAIModelId());

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: originalLocalStorage,
});
