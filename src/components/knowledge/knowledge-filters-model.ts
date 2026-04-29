type KnowledgeFiltersSearchParams = {
  q?: string | string[] | undefined;
  tag?: string | string[] | undefined;
  space?: string | string[] | undefined;
  status?: string | string[] | undefined;
  type?: string | string[] | undefined;
  category?: string | string[] | undefined;
  favorite?: string | string[] | undefined;
  order?: string | string[] | undefined;
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
const VALID_ORDERS = new Set(["updated_at_desc", "created_at_desc", "created_at_asc"]);

export function getKnowledgeFavoriteFilter(
  searchParams: KnowledgeFiltersSearchParams | undefined,
): boolean | undefined {
  return getFirstTrimmedParam(searchParams?.favorite) === "true"
    ? true
    : undefined;
}

export function buildKnowledgeFavoriteFilterHref({
  currentSearchParams,
  isFavorite,
}: {
  currentSearchParams: KnowledgeFiltersSearchParams | undefined;
  isFavorite: boolean;
}) {
  const searchParams = buildBaseKnowledgeFilterSearchParams(currentSearchParams);

  if (isFavorite) {
    searchParams.set("favorite", "true");
  } else {
    searchParams.delete("favorite");
  }

  const queryString = searchParams.toString();

  return queryString ? `/app?${queryString}` : "/app";
}

export function buildClearKnowledgeFiltersHref() {
  return "/app";
}

export function buildBaseKnowledgeFilterSearchParams(
  currentSearchParams: KnowledgeFiltersSearchParams | undefined,
) {
  const searchParams = new URLSearchParams();
  const keyword = getFirstTrimmedParam(currentSearchParams?.q);
  const selectedTagId = getFirstTrimmedParam(currentSearchParams?.tag);
  const space = getFirstTrimmedParam(currentSearchParams?.space);
  const status = getFirstTrimmedParam(currentSearchParams?.status);
  const type = getFirstTrimmedParam(currentSearchParams?.type);
  const category = getFirstTrimmedParam(currentSearchParams?.category);
  const order = getFirstTrimmedParam(currentSearchParams?.order);
  const isFavorite = getKnowledgeFavoriteFilter(currentSearchParams);

  if (keyword) {
    searchParams.set("q", keyword);
  }

  if (selectedTagId) {
    searchParams.set("tag", selectedTagId);
  }

  if (space && VALID_SPACES.has(space)) {
    searchParams.set("space", space);
  }

  if (status && VALID_STATUSES.has(status)) {
    searchParams.set("status", status);
  }

  if (type && VALID_TYPES.has(type)) {
    searchParams.set("type", type);
  }

  if (category) {
    searchParams.set("category", category);
  }

  if (isFavorite) {
    searchParams.set("favorite", "true");
  }

  if (order && VALID_ORDERS.has(order) && order !== "updated_at_desc") {
    searchParams.set("order", order);
  }

  return searchParams;
}

function getFirstTrimmedParam(
  value: string | string[] | undefined,
): string | undefined {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const trimmed = firstValue?.trim();

  return trimmed ? trimmed : undefined;
}
