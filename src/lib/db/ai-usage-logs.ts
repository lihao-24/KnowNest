import {
  and,
  count,
  eq,
  gte,
  lt,
} from "drizzle-orm";

import type { AIAction } from "../../types/ai";

export type CreateAIUsageLogInput = {
  userId: string;
  knowledgeItemId?: string | null;
  actionType: AIAction;
  model: string;
  status: "success" | "failed";
  inputLength: number;
  outputLength: number;
  errorMessage?: string | null;
};

export type AIUsageLogValues = {
  user_id: string;
  knowledge_item_id: string | null;
  action_type: AIAction;
  model: string;
  status: "success" | "failed";
  input_length: number;
  output_length: number;
  error_message: string | null;
};

export function buildAIUsageLogValues(
  input: CreateAIUsageLogInput,
): AIUsageLogValues {
  return {
    user_id: input.userId,
    knowledge_item_id: input.knowledgeItemId ?? null,
    action_type: input.actionType,
    model: input.model,
    status: input.status,
    input_length: Math.max(0, input.inputLength),
    output_length: Math.max(0, input.outputLength),
    error_message: normalizeNullableText(input.errorMessage),
  };
}

export function getUTCDayRange(now = new Date()): {
  start: string;
  end: string;
} {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function createAIUsageLog(
  input: CreateAIUsageLogInput,
): Promise<void> {
  const { db } = await import("./client");
  const { aiUsageLogs } = await import("./schema");

  await db.insert(aiUsageLogs).values(buildAIUsageLogValues(input));
}

export async function countTodayAIUsage(userId: string): Promise<number> {
  const { db } = await import("./client");
  const { aiUsageLogs } = await import("./schema");
  const { start, end } = getUTCDayRange();
  const rows = await db
    .select({ value: count() })
    .from(aiUsageLogs)
    .where(
      and(
        eq(aiUsageLogs.user_id, userId),
        gte(aiUsageLogs.created_at, start),
        lt(aiUsageLogs.created_at, end),
      ),
    );

  return rows[0]?.value ?? 0;
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
