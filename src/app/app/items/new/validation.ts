export const EMPTY_KNOWLEDGE_ITEM_MESSAGE = "标题和正文不能同时为空。";

export type KnowledgeItemDraft = {
  title: string;
  content: string;
};

export type KnowledgeItemDraftValidationResult =
  | {
      ok: true;
      value: KnowledgeItemDraft;
    }
  | {
      ok: false;
      error: string;
    };

export function validateKnowledgeItemDraft(
  draft: KnowledgeItemDraft,
): KnowledgeItemDraftValidationResult {
  const title = draft.title.trim();
  const content = draft.content.trim();

  if (!title && !content) {
    return {
      ok: false,
      error: EMPTY_KNOWLEDGE_ITEM_MESSAGE,
    };
  }

  return {
    ok: true,
    value: {
      title,
      content,
    },
  };
}
