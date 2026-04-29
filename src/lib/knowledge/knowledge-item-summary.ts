export const EMPTY_KNOWLEDGE_ITEM_SUMMARY_MESSAGE = "摘要不能为空。";
export const APPLY_KNOWLEDGE_ITEM_SUMMARY_FAILED_MESSAGE =
  "应用摘要失败，请稍后重试。";
export const APPLY_KNOWLEDGE_ITEM_SUMMARY_NOT_FOUND_MESSAGE =
  "没有找到这条知识，或你没有访问权限。";
export const APPLY_KNOWLEDGE_ITEM_SUMMARY_SUCCESS_MESSAGE = "已应用 AI 摘要。";

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

export type ApplyKnowledgeItemSummaryDependencies = {
  authRequiredMessage: string;
  requireUser: () => Promise<{ id: string }>;
  updateKnowledgeItem: (
    userId: string,
    itemId: string,
    payload: KnowledgeItemSummaryPayload,
  ) => Promise<unknown | null>;
  revalidatePath: (path: string) => void;
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

export async function runApplyKnowledgeItemSummary(
  itemId: string,
  summary: string,
  dependencies: ApplyKnowledgeItemSummaryDependencies,
  now?: string,
): Promise<{ errorMessage: string; successMessage: string }> {
  try {
    const user = await dependencies.requireUser();
    const payload = buildKnowledgeItemSummaryPayload(summary, now);

    if (!payload.ok) {
      return {
        errorMessage: EMPTY_KNOWLEDGE_ITEM_SUMMARY_MESSAGE,
        successMessage: "",
      };
    }

    const updatedItem = await dependencies.updateKnowledgeItem(
      user.id,
      itemId,
      payload.value,
    );

    if (!updatedItem) {
      return {
        errorMessage: APPLY_KNOWLEDGE_ITEM_SUMMARY_NOT_FOUND_MESSAGE,
        successMessage: "",
      };
    }
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error &&
        error.message === dependencies.authRequiredMessage
          ? dependencies.authRequiredMessage
          : APPLY_KNOWLEDGE_ITEM_SUMMARY_FAILED_MESSAGE,
      successMessage: "",
    };
  }

  buildKnowledgeItemSummaryRevalidationPaths(itemId).forEach((path) => {
    dependencies.revalidatePath(path);
  });

  return {
    errorMessage: "",
    successMessage: APPLY_KNOWLEDGE_ITEM_SUMMARY_SUCCESS_MESSAGE,
  };
}
