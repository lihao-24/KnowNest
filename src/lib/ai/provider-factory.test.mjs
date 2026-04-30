import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
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

const { createAIProvider } = await import("./provider-factory.ts");

assert.equal(
  existsSync(new URL("./deepseek.ts", import.meta.url)),
  false,
);

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
