export const INVALID_KNOWLEDGE_ITEM_FAVORITE_MESSAGE = "收藏状态不正确。";

export type KnowledgeItemFavoritePayload = {
  itemId: string;
  nextValue: boolean;
};

export type KnowledgeItemFavoriteValidationResult =
  | {
      ok: true;
      value: KnowledgeItemFavoritePayload;
    }
  | {
      ok: false;
      error: string;
    };

export function buildKnowledgeItemFavoritePayload(
  itemId: string,
  formData: FormData,
): KnowledgeItemFavoriteValidationResult {
  const nextValue = parseFavoriteValue(formData.get("nextValue"));

  if (nextValue === null) {
    return {
      ok: false,
      error: INVALID_KNOWLEDGE_ITEM_FAVORITE_MESSAGE,
    };
  }

  return {
    ok: true,
    value: {
      itemId,
      nextValue,
    },
  };
}

export function getKnowledgeItemFavoriteButtonLabel(
  isFavorite: boolean,
  isPending: boolean,
) {
  if (isPending) {
    return "处理中...";
  }

  return isFavorite ? "取消收藏" : "收藏";
}

export function getKnowledgeItemFavoriteStatusLabel(isFavorite: boolean) {
  return isFavorite ? "已收藏" : "未收藏";
}

function parseFavoriteValue(value: FormDataEntryValue | null) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}
