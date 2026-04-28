import type {
  KnowledgeSpace,
  KnowledgeStatus,
  KnowledgeType,
} from "@/types/knowledge";

type KnowledgeMetadataFilterSearchParams = {
  q?: string | string[] | undefined;
  tag?: string | string[] | undefined;
  space?: string | string[] | undefined;
  status?: string | string[] | undefined;
  type?: string | string[] | undefined;
};

export type KnowledgeMetadataFilters = {
  space?: KnowledgeSpace | undefined;
  status?: KnowledgeStatus | undefined;
  type?: KnowledgeType | undefined;
};

const VALID_SPACES = new Set(["life", "work"]);
const VALID_STATUSES = new Set(["inbox", "organized", "archived"]);
const VALID_TYPES = new Set([
  "note",
  "link",
  "prompt",
  "project",
  "log",
  "excerpt",
  "plan",
  "snippet",
]);

export function getKnowledgeMetadataFilters(
  searchParams: KnowledgeMetadataFilterSearchParams | undefined,
): KnowledgeMetadataFilters {
  const space = getFirstTrimmedParam(searchParams?.space);
  const status = getFirstTrimmedParam(searchParams?.status);
  const type = getFirstTrimmedParam(searchParams?.type);

  return {
    space: isKnowledgeSpace(space) ? space : undefined,
    status: isKnowledgeStatus(status) ? status : undefined,
    type: isKnowledgeType(type) ? type : undefined,
  };
}

export function buildKnowledgeMetadataFilterHref({
  currentSearchParams,
  nextFilters,
}: {
  currentSearchParams: KnowledgeMetadataFilterSearchParams | undefined;
  nextFilters: KnowledgeMetadataFilters;
}) {
  const searchParams = new URLSearchParams();
  const keyword = getFirstTrimmedParam(currentSearchParams?.q);
  const selectedTagId = getFirstTrimmedParam(currentSearchParams?.tag);
  const currentFilters = getKnowledgeMetadataFilters(currentSearchParams);
  const filters = {
    ...currentFilters,
    ...nextFilters,
  };

  if (keyword) {
    searchParams.set("q", keyword);
  }

  if (selectedTagId) {
    searchParams.set("tag", selectedTagId);
  }

  if (filters.space) {
    searchParams.set("space", filters.space);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  if (filters.type) {
    searchParams.set("type", filters.type);
  }

  const queryString = searchParams.toString();

  return queryString ? `/app?${queryString}` : "/app";
}

function getFirstTrimmedParam(
  value: string | string[] | undefined,
): string | undefined {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const trimmed = firstValue?.trim();

  return trimmed ? trimmed : undefined;
}

function isKnowledgeSpace(value: string | undefined): value is KnowledgeSpace {
  return value !== undefined && VALID_SPACES.has(value);
}

function isKnowledgeStatus(
  value: string | undefined,
): value is KnowledgeStatus {
  return value !== undefined && VALID_STATUSES.has(value);
}

function isKnowledgeType(value: string | undefined): value is KnowledgeType {
  return value !== undefined && VALID_TYPES.has(value);
}
