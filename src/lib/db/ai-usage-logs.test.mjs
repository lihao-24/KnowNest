import assert from "node:assert/strict";

import { getTableConfig } from "drizzle-orm/pg-core";

import {
  buildAIUsageLogValues,
  getUTCDayRange,
} from "./ai-usage-logs.ts";
import * as schema from "./schema.ts";

assert.ok(schema.aiUsageLogs);

const usageLogsConfig = getTableConfig(schema.aiUsageLogs);
const userIdForeignKey = usageLogsConfig.foreignKeys.find((foreignKey) => {
  const reference = foreignKey.reference();

  return (
    reference.columns.includes(schema.aiUsageLogs.user_id) &&
    reference.foreignTable === schema.profiles &&
    reference.foreignColumns.includes(schema.profiles.id)
  );
});

assert.equal(userIdForeignKey?.onDelete, "cascade");

const itemUserForeignKey = usageLogsConfig.foreignKeys.find((foreignKey) => {
  const reference = foreignKey.reference();
  const columnNames = reference.columns.map((column) => column.name);
  const foreignColumnNames = reference.foreignColumns.map((column) => column.name);

  return (
    reference.foreignTable === schema.knowledgeItems &&
    columnNames.includes("knowledge_item_id") &&
    columnNames.includes("user_id") &&
    foreignColumnNames.includes("id") &&
    foreignColumnNames.includes("user_id")
  );
});

assert.equal(itemUserForeignKey?.onDelete, "set null");

assert.ok(
  usageLogsConfig.checks.some(
    (constraint) => constraint.name === "ai_usage_logs_status_check",
  ),
);
assert.ok(
  usageLogsConfig.checks.some(
    (constraint) => constraint.name === "ai_usage_logs_action_type_check",
  ),
);

assert.deepEqual(
  buildAIUsageLogValues({
    userId: "user-1",
    knowledgeItemId: "item-1",
    actionType: "generate_summary",
    model: "deepseek-v4-flash",
    status: "success",
    inputLength: 120,
    outputLength: 60,
    errorMessage: undefined,
  }),
  {
    user_id: "user-1",
    knowledge_item_id: "item-1",
    action_type: "generate_summary",
    model: "deepseek-v4-flash",
    status: "success",
    input_length: 120,
    output_length: 60,
    error_message: null,
  },
);

const failedPayload = buildAIUsageLogValues({
  userId: "user-1",
  knowledgeItemId: undefined,
  actionType: "organize_content",
  model: "deepseek-v4-flash",
  status: "failed",
  inputLength: 1000,
  outputLength: 0,
  errorMessage: "  provider failed  ",
});

assert.equal(failedPayload.knowledge_item_id, null);
assert.equal(failedPayload.error_message, "provider failed");
assert.equal("content" in failedPayload, false);

assert.deepEqual(getUTCDayRange(new Date("2026-04-29T15:30:00.000Z")), {
  start: "2026-04-29T00:00:00.000Z",
  end: "2026-04-30T00:00:00.000Z",
});
