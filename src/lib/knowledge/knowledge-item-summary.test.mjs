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
  APPLY_KNOWLEDGE_ITEM_SUMMARY_FAILED_MESSAGE,
  APPLY_KNOWLEDGE_ITEM_SUMMARY_NOT_FOUND_MESSAGE,
  APPLY_KNOWLEDGE_ITEM_SUMMARY_SUCCESS_MESSAGE,
  EMPTY_KNOWLEDGE_ITEM_SUMMARY_MESSAGE,
  buildKnowledgeItemSummaryPayload,
  buildKnowledgeItemSummaryRevalidationPaths,
  runApplyKnowledgeItemSummary,
} = await import("./knowledge-item-summary.ts");

assert.equal(typeof runApplyKnowledgeItemSummary, "function");

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

const createApplySummaryDeps = ({
  requireUser = async () => ({ id: "user-1" }),
  updateKnowledgeItem = async () => ({ id: "item-1" }),
} = {}) => {
  const calls = {
    events: [],
    requireUser: [],
    revalidatePath: [],
    updateKnowledgeItem: [],
  };

  return {
    calls,
    deps: {
      authRequiredMessage: "AUTH_REQUIRED",
      requireUser: async () => {
        calls.events.push("requireUser");
        const user = await requireUser();
        calls.requireUser.push(user);
        return user;
      },
      updateKnowledgeItem: async (...args) => {
        calls.events.push("updateKnowledgeItem");
        calls.updateKnowledgeItem.push(args);
        return updateKnowledgeItem(...args);
      },
      revalidatePath: (path) => {
        calls.events.push("revalidatePath");
        calls.revalidatePath.push(path);
      },
    },
  };
};

{
  const { calls, deps } = createApplySummaryDeps();
  const result = await runApplyKnowledgeItemSummary(
    "item-1",
    "  AI 摘要内容  ",
    deps,
    fixedNow,
  );

  assert.deepEqual(result, {
    errorMessage: "",
    successMessage: APPLY_KNOWLEDGE_ITEM_SUMMARY_SUCCESS_MESSAGE,
  });
  assert.deepEqual(calls.events, [
    "requireUser",
    "updateKnowledgeItem",
    "revalidatePath",
    "revalidatePath",
    "revalidatePath",
    "revalidatePath",
    "revalidatePath",
  ]);
  assert.deepEqual(calls.requireUser, [{ id: "user-1" }]);
  assert.deepEqual(calls.updateKnowledgeItem, [
    [
      "user-1",
      "item-1",
      {
        summary: "AI 摘要内容",
        summary_generated_at: fixedNow,
        ai_updated_at: fixedNow,
      },
    ],
  ]);
  assert.deepEqual(
    calls.revalidatePath,
    buildKnowledgeItemSummaryRevalidationPaths("item-1"),
  );
}

{
  const { calls, deps } = createApplySummaryDeps();
  const result = await runApplyKnowledgeItemSummary(
    "item-1",
    "   ",
    deps,
    fixedNow,
  );

  assert.deepEqual(result, {
    errorMessage: EMPTY_KNOWLEDGE_ITEM_SUMMARY_MESSAGE,
    successMessage: "",
  });
  assert.deepEqual(calls.events, ["requireUser"]);
  assert.deepEqual(calls.requireUser, [{ id: "user-1" }]);
  assert.deepEqual(calls.updateKnowledgeItem, []);
  assert.deepEqual(calls.revalidatePath, []);
}

{
  const { calls, deps } = createApplySummaryDeps({
    updateKnowledgeItem: async () => null,
  });
  const result = await runApplyKnowledgeItemSummary(
    "missing-item",
    "AI 摘要内容",
    deps,
    fixedNow,
  );

  assert.deepEqual(result, {
    errorMessage: APPLY_KNOWLEDGE_ITEM_SUMMARY_NOT_FOUND_MESSAGE,
    successMessage: "",
  });
  assert.deepEqual(calls.events, ["requireUser", "updateKnowledgeItem"]);
  assert.deepEqual(calls.updateKnowledgeItem.length, 1);
  assert.deepEqual(calls.revalidatePath, []);
}

{
  const { calls, deps } = createApplySummaryDeps({
    requireUser: async () => {
      throw new Error("AUTH_REQUIRED");
    },
  });
  const result = await runApplyKnowledgeItemSummary(
    "item-1",
    "AI 摘要内容",
    deps,
    fixedNow,
  );

  assert.deepEqual(result, {
    errorMessage: "AUTH_REQUIRED",
    successMessage: "",
  });
  assert.deepEqual(calls.events, ["requireUser"]);
  assert.deepEqual(calls.updateKnowledgeItem, []);
  assert.deepEqual(calls.revalidatePath, []);
}

{
  const { calls, deps } = createApplySummaryDeps({
    updateKnowledgeItem: async () => {
      throw new Error("database unavailable");
    },
  });
  const result = await runApplyKnowledgeItemSummary(
    "item-1",
    "AI 摘要内容",
    deps,
    fixedNow,
  );

  assert.deepEqual(result, {
    errorMessage: APPLY_KNOWLEDGE_ITEM_SUMMARY_FAILED_MESSAGE,
    successMessage: "",
  });
  assert.deepEqual(calls.events, ["requireUser", "updateKnowledgeItem"]);
  assert.deepEqual(calls.updateKnowledgeItem.length, 1);
  assert.deepEqual(calls.revalidatePath, []);
}
