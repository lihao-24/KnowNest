import {
  KNOWLEDGE_SPACES,
  KNOWLEDGE_STATUSES,
  KNOWLEDGE_TYPES,
} from "../../constants/knowledge";
import type {
  KnowledgeItem,
  KnowledgeItemWithMetadata,
  KnowledgeItemWithTags,
} from "../../types/knowledge";

export const DEFAULT_KNOWLEDGE_ITEM_TITLE = "未命名内容";
export const EMPTY_KNOWLEDGE_ITEM_SUMMARY = "暂无正文内容";

const SUMMARY_MAX_LENGTH = 120;

const knowledgeSpaceLabels = buildKnowledgeLabelMap(KNOWLEDGE_SPACES);
const knowledgeTypeLabels = buildKnowledgeLabelMap(KNOWLEDGE_TYPES);
const knowledgeStatusLabels = buildKnowledgeLabelMap(KNOWLEDGE_STATUSES);

export type KnowledgeListItemViewModel = {
  title: string;
  summary: string;
  spaceLabel: string;
  typeLabel: string;
  statusLabel: string;
  categoryLabel: string;
  updatedAtLabel: string;
  favoriteLabel: string;
  tagNames: string[];
};

export function buildKnowledgeListItemViewModel(
  item: KnowledgeItem | KnowledgeItemWithTags | KnowledgeItemWithMetadata,
): KnowledgeListItemViewModel {
  return {
    title: formatKnowledgeItemTitle(item.title),
    summary: buildKnowledgeItemSummary(item.content),
    spaceLabel: knowledgeSpaceLabels[item.space],
    typeLabel: knowledgeTypeLabels[item.type],
    statusLabel: knowledgeStatusLabels[item.status],
    categoryLabel: "category" in item && item.category ? item.category.name : "未分类",
    updatedAtLabel: formatKnowledgeItemDate(item.updated_at),
    favoriteLabel: item.is_favorite ? "已收藏" : "未收藏",
    tagNames: "tags" in item ? item.tags.map((tag) => tag.name) : [],
  };
}

function buildKnowledgeLabelMap<TValue extends string>(
  options: readonly { value: TValue; label: string }[],
) {
  return Object.fromEntries(
    options.map((option) => [option.value, option.label]),
  ) as Record<TValue, string>;
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
