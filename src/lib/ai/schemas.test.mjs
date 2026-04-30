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

const { parseAIJson, validateAIResult } = await import("./schemas.ts");

assert.deepEqual(parseAIJson('{"summary":"ok"}'), { summary: "ok" });

assert.throws(
  () => parseAIJson(""),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "empty_provider_response",
);

assert.throws(
  () => parseAIJson("not json"),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "invalid_provider_response",
);

assert.deepEqual(
  validateAIResult("generate_summary", { summary: "  摘要内容  " }),
  { summary: "摘要内容" },
);

assert.deepEqual(
  validateAIResult("suggest_tags", {
    tags: [" Supabase ", "", "RLS", "Supabase", "Next.js"],
  }),
  { tags: ["Supabase", "RLS", "Next.js"] },
);

assert.throws(
  () => validateAIResult("suggest_tags", { tags: ["a", "b"] }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "invalid_provider_response",
);

assert.deepEqual(
  validateAIResult("suggest_category", {
    category: " 项目 ",
    reason: " 与项目开发相关 ",
  }),
  { category: "项目", reason: "与项目开发相关" },
);

assert.deepEqual(validateAIResult("improve_title", { title: "清晰标题" }), {
  title: "清晰标题",
});

assert.throws(
  () =>
    validateAIResult("improve_title", {
      title: "这是一个明显超过三十个字符限制的标题，应被识别为格式异常并拒绝返回",
    }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "invalid_provider_response",
);

assert.deepEqual(
  validateAIResult("organize_content", {
    content: "## 背景\n\n整理后的内容",
  }),
  { content: "## 背景\n\n整理后的内容" },
);

assert.throws(
  () => validateAIResult("generate_summary", { summary: "   " }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "invalid_provider_response",
);
