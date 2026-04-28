import type { ListKnowledgeItemsParams } from "../db/knowledge-items";

export const favoritesPageHeader = {
  eyebrow: "收藏",
  title: "收藏",
  description: "集中查看你标记为重要的知识内容。",
} as const;

export const favoritesKnowledgeListEmptyState = {
  title: "还没有收藏内容",
  description: "收藏重要内容后，它们会集中出现在这里，方便之后快速回看。",
  actionLabel: "新建知识",
} as const;

export function buildFavoritesKnowledgeListParams(): ListKnowledgeItemsParams {
  return {
    isFavorite: true,
  };
}
