export const EMPTY_KNOWLEDGE_ITEM_SUMMARY_MESSAGE = "摘要不能为空。";

export type KnowledgeItemSummaryPayload = {
  summary: string;
  summary_generated_at: string;
  ai_updated_at: string;
};

export type KnowledgeItemSummaryValidationResult =
  | {
      ok: true;
      value: KnowledgeItemSummaryPayload;
    }
  | {
      ok: false;
      error: string;
    };

export function buildKnowledgeItemSummaryPayload(
  summary: string,
  now = new Date().toISOString(),
): KnowledgeItemSummaryValidationResult {
  const trimmedSummary = summary.trim();

  if (!trimmedSummary) {
    return {
      ok: false,
      error: EMPTY_KNOWLEDGE_ITEM_SUMMARY_MESSAGE,
    };
  }

  return {
    ok: true,
    value: {
      summary: trimmedSummary,
      summary_generated_at: now,
      ai_updated_at: now,
    },
  };
}

export function buildKnowledgeItemSummaryRevalidationPaths(itemId: string) {
  return [
    "/app",
    `/app/items/${itemId}`,
    "/app/inbox",
    "/app/favorites",
    "/app/archive",
  ];
}
