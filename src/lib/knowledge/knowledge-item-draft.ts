import {
  KNOWLEDGE_SPACES,
  KNOWLEDGE_STATUSES,
  KNOWLEDGE_TYPES,
} from "../../constants/knowledge";
import type {
  KnowledgeSpace,
  KnowledgeStatus,
  KnowledgeType,
} from "../../types/knowledge";

export const EMPTY_KNOWLEDGE_ITEM_MESSAGE = "标题和正文不能同时为空。";
export const INVALID_KNOWLEDGE_ITEM_METADATA_MESSAGE =
  "空间、类型或状态不正确。";

const DEFAULT_KNOWLEDGE_SPACE: KnowledgeSpace = "work";
const DEFAULT_KNOWLEDGE_TYPE: KnowledgeType = "note";
const DEFAULT_KNOWLEDGE_STATUS: KnowledgeStatus = "inbox";
const knowledgeSpaceValues = buildKnowledgeValueSet(KNOWLEDGE_SPACES);
const knowledgeTypeValues = buildKnowledgeValueSet(KNOWLEDGE_TYPES);
const knowledgeStatusValues = buildKnowledgeValueSet(KNOWLEDGE_STATUSES);

export type KnowledgeItemDraftInput = {
  title: string;
  content: string;
  space?: string;
  type?: string;
  status?: string;
};

export type KnowledgeItemDraft = {
  title: string;
  content: string;
  space: KnowledgeSpace;
  type: KnowledgeType;
  status: KnowledgeStatus;
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

export function buildKnowledgeItemDraftPayload(
  formData: FormData,
): KnowledgeItemDraftValidationResult {
  return validateKnowledgeItemDraft({
    title: getFormDataString(formData, "title") ?? "",
    content: getFormDataString(formData, "content") ?? "",
    space: getFormDataString(formData, "space"),
    type: getFormDataString(formData, "type"),
    status: getFormDataString(formData, "status"),
  });
}

export function buildKnowledgeItemDraftRevalidationPaths(itemId: string) {
  return [
    "/app",
    "/app/inbox",
    "/app/favorites",
    "/app/archive",
    `/app/items/${itemId}`,
  ];
}

export function validateKnowledgeItemDraft(
  draft: KnowledgeItemDraftInput,
): KnowledgeItemDraftValidationResult {
  const title = draft.title.trim();
  const content = draft.content.trim();

  if (!title && !content) {
    return {
      ok: false,
      error: EMPTY_KNOWLEDGE_ITEM_MESSAGE,
    };
  }

  const metadata = normalizeKnowledgeItemMetadata(draft);

  if (!metadata) {
    return {
      ok: false,
      error: INVALID_KNOWLEDGE_ITEM_METADATA_MESSAGE,
    };
  }

  return {
    ok: true,
    value: {
      title,
      content,
      ...metadata,
    },
  };
}

function normalizeKnowledgeItemMetadata(draft: KnowledgeItemDraftInput) {
  const space = normalizeKnowledgeOption(
    draft.space,
    DEFAULT_KNOWLEDGE_SPACE,
    isKnowledgeSpace,
  );
  const type = normalizeKnowledgeOption(
    draft.type,
    DEFAULT_KNOWLEDGE_TYPE,
    isKnowledgeType,
  );
  const status = normalizeKnowledgeOption(
    draft.status,
    DEFAULT_KNOWLEDGE_STATUS,
    isKnowledgeStatus,
  );

  if (!space || !type || !status) {
    return null;
  }

  return {
    space,
    type,
    status,
  };
}

function normalizeKnowledgeOption<TValue extends string>(
  value: string | undefined,
  defaultValue: TValue,
  isAllowedValue: (value: string) => value is TValue,
) {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  return isAllowedValue(value) ? value : null;
}

function isKnowledgeSpace(value: string): value is KnowledgeSpace {
  return knowledgeSpaceValues.has(value);
}

function isKnowledgeType(value: string): value is KnowledgeType {
  return knowledgeTypeValues.has(value);
}

function isKnowledgeStatus(value: string): value is KnowledgeStatus {
  return knowledgeStatusValues.has(value);
}

function buildKnowledgeValueSet<TValue extends string>(
  options: readonly { value: TValue }[],
) {
  return new Set<string>(options.map((option) => option.value));
}

function getFormDataString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}
