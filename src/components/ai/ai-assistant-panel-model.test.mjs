import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code === "ERR_MODULE_NOT_FOUND" &&
        specifier.startsWith("./") &&
        !specifier.endsWith(".ts")
      ) {
        return nextResolve(`${specifier}.ts`, context);
      }

      throw error;
    }
  },
});

const {
  GENERATE_SUMMARY_FAILED_MESSAGE,
  buildGenerateSummaryResult,
  getGenerateSummaryStartedFeedback,
} = await import("./ai-assistant-panel-model.ts");

assert.deepEqual(getGenerateSummaryStartedFeedback(), {
  summaryPreview: "",
  errorMessage: "",
  successMessage: "",
});

assert.deepEqual(
  buildGenerateSummaryResult(true, {
    ok: true,
    result: {
      summary: "AI 摘要内容",
    },
  }),
  {
    ok: true,
    summary: "AI 摘要内容",
  },
);

assert.deepEqual(
  buildGenerateSummaryResult(false, {
    ok: false,
    error: {
      message: "今日 AI 使用次数已达上限。",
    },
  }),
  {
    ok: false,
    errorMessage: "今日 AI 使用次数已达上限。",
  },
);

assert.deepEqual(
  buildGenerateSummaryResult(true, {
    ok: true,
    result: {
      summary: "   ",
    },
  }),
  {
    ok: false,
    errorMessage: GENERATE_SUMMARY_FAILED_MESSAGE,
  },
);

assert.deepEqual(
  buildGenerateSummaryResult(true, {
    ok: true,
    result: {},
  }),
  {
    ok: false,
    errorMessage: GENERATE_SUMMARY_FAILED_MESSAGE,
  },
);
