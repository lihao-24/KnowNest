import type { KnowledgeItem } from "../../types/knowledge";

export const DEFAULT_KNOWLEDGE_ITEM_TITLE = "未命名内容";
export const EMPTY_KNOWLEDGE_ITEM_SUMMARY = "暂无正文内容";

const SUMMARY_MAX_LENGTH = 120;

const spaceLabels: Record<KnowledgeItem["space"], string> = {
  life: "生活",
  work: "工作",
};

const typeLabels: Record<KnowledgeItem["type"], string> = {
  excerpt: "摘录",
  link: "链接",
  log: "日志",
  note: "笔记",
  plan: "计划",
  project: "项目记录",
  prompt: "Prompt",
  snippet: "代码片段",
};

export type KnowledgeListItemViewModel = {
  title: string;
  summary: string;
  spaceLabel: string;
  typeLabel: string;
  updatedAtLabel: string;
  favoriteLabel: string;
};

export function buildKnowledgeListItemViewModel(
  item: KnowledgeItem,
): KnowledgeListItemViewModel {
  return {
    title: formatKnowledgeItemTitle(item.title),
    summary: buildKnowledgeItemSummary(item.content),
    spaceLabel: spaceLabels[item.space],
    typeLabel: typeLabels[item.type],
    updatedAtLabel: formatKnowledgeItemDate(item.updated_at),
    favoriteLabel: item.is_favorite ? "已收藏" : "未收藏",
  };
}

function formatKnowledgeItemTitle(title: string) {
  const trimmed = title.trim();

  return trimmed || DEFAULT_KNOWLEDGE_ITEM_TITLE;
}

function buildKnowledgeItemSummary(content: string) {
  const summary = content.replace(/\s+/g, " ").trim();

  if (!summary) {
    return EMPTY_KNOWLEDGE_ITEM_SUMMARY;
  }

  if (summary.length <= SUMMARY_MAX_LENGTH) {
    return summary;
  }

  return `${summary.slice(0, SUMMARY_MAX_LENGTH)}...`;
}

function formatKnowledgeItemDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}
