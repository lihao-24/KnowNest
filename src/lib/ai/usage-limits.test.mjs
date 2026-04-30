import assert from "node:assert/strict";
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

const {
  assertAIUsageAllowed,
  validateAIInputLength,
} = await import("./usage-limits.ts");

assert.doesNotThrow(() => assertAIUsageAllowed(19, 20));

assert.throws(
  () => assertAIUsageAllowed(20, 20),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "daily_limit_exceeded" &&
    error.status === 429,
);

assert.throws(
  () => validateAIInputLength("   ", 20, 8000),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "content_empty" &&
    error.status === 400,
);

assert.throws(
  () => validateAIInputLength("short", 20, 8000),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "content_too_short" &&
    error.status === 400,
);

assert.throws(
  () => validateAIInputLength("123456", 1, 5),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "content_too_long" &&
    error.status === 400,
);

assert.doesNotThrow(() => validateAIInputLength("足够长的正文内容", 5, 20));
