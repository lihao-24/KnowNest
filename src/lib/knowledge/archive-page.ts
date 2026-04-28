import type { ListKnowledgeItemsParams } from "../db/knowledge-items";

export const archivePageHeader = {
  eyebrow: "归档",
  title: "归档",
  description: "查看已经归档的知识内容。",
} as const;

export const archiveKnowledgeListEmptyState = {
  title: "归档是空的",
  description: "归档后的内容会集中出现在这里，默认不会显示在全部内容页。",
  actionLabel: "新建知识",
} as const;

export function buildArchiveKnowledgeListParams(): ListKnowledgeItemsParams {
  return {
    status: "archived",
  };
}
