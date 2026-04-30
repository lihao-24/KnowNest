import assert from "node:assert/strict";

import { createAIProvider } from "./provider-factory.ts";

const provider = createAIProvider({
  id: "test-model",
  label: "Test Model",
  provider: "openai-compatible",
  apiKey: "test-key",
  baseUrl: "https://example.com/v1",
  model: "test-model",
});

assert.equal(typeof provider.generate, "function");

assert.throws(
  () =>
    createAIProvider({
      id: "unsupported-model",
      label: "Unsupported Model",
      provider: "unsupported",
      apiKey: "test-key",
      baseUrl: "https://example.com/v1",
      model: "test-model",
    }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "provider_not_configured",
);
