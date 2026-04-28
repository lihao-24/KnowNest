import type { ListKnowledgeItemsParams } from "../db/knowledge-items";

export const inboxPageHeader = {
  eyebrow: "收集箱",
  title: "收集箱",
  description: "临时保存的内容，可以稍后整理。",
} as const;

export const inboxKnowledgeListEmptyState = {
  title: "收集箱是空的",
  description:
    "这里保存的是还没有整理的内容。你可以先快速记录，之后再补充空间、类型和标签。",
  actionLabel: "新建知识",
} as const;

export function buildInboxKnowledgeListParams(): ListKnowledgeItemsParams {
  return {
    status: "inbox",
  };
}
