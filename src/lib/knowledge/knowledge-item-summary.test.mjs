import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code === "ERR_MODULE_NOT_FOUND" &&
        specifier.startsWith("../") &&
        !specifier.endsWith(".ts")
      ) {
        return nextResolve(`${specifier}.ts`, context);
      }

      throw error;
    }
  },
});

const {
  EMPTY_KNOWLEDGE_ITEM_SUMMARY_MESSAGE,
  buildKnowledgeItemSummaryPayload,
  buildKnowledgeItemSummaryRevalidationPaths,
} = await import("./knowledge-item-summary.ts");

const fixedNow = "2026-04-29T01:02:03.000Z";

assert.deepEqual(buildKnowledgeItemSummaryPayload("  AI 摘要内容  ", fixedNow), {
  ok: true,
  value: {
    summary: "AI 摘要内容",
    summary_generated_at: fixedNow,
    ai_updated_at: fixedNow,
  },
});

const generatedNowPayload = buildKnowledgeItemSummaryPayload("AI 摘要内容");

assert.equal(generatedNowPayload.ok, true);
assert.equal(
  generatedNowPayload.ok
    ? generatedNowPayload.value.summary_generated_at
    : "",
  generatedNowPayload.ok ? generatedNowPayload.value.ai_updated_at : "unused",
);
assert.ok(
  generatedNowPayload.ok &&
    !Number.isNaN(Date.parse(generatedNowPayload.value.ai_updated_at)),
);

assert.deepEqual(buildKnowledgeItemSummaryPayload("\n\t "), {
  ok: false,
  error: EMPTY_KNOWLEDGE_ITEM_SUMMARY_MESSAGE,
});

assert.deepEqual(buildKnowledgeItemSummaryRevalidationPaths("item-1"), [
  "/app",
  "/app/items/item-1",
  "/app/inbox",
  "/app/favorites",
  "/app/archive",
]);
