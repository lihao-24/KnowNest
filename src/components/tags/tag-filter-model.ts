type TagFilterSearchParams = {
  tag?: string | string[] | undefined;
  q?: string | string[] | undefined;
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

export function getSelectedTagId(
  searchParams: TagFilterSearchParams | undefined,
): string | undefined {
  const tagParam = Array.isArray(searchParams?.tag)
    ? searchParams.tag[0]
    : searchParams?.tag;
  const selectedTagId = tagParam?.trim();

  return selectedTagId ? selectedTagId : undefined;
}

export function buildTagFilterHref({
  currentSearchParams,
  nextTagId,
}: {
  currentSearchParams: TagFilterSearchParams | undefined;
  currentTagId: string | undefined;
  nextTagId: string | undefined;
}) {
  const searchParams = new URLSearchParams();
  const keyword = getFirstTrimmedParam(currentSearchParams?.q);
  const space = getFirstTrimmedParam(currentSearchParams?.space);
  const status = getFirstTrimmedParam(currentSearchParams?.status);
  const type = getFirstTrimmedParam(currentSearchParams?.type);
  const category = getFirstTrimmedParam(currentSearchParams?.category);
  const favorite = getFirstTrimmedParam(currentSearchParams?.favorite);
  const order = getFirstTrimmedParam(currentSearchParams?.order);

  if (keyword) {
    searchParams.set("q", keyword);
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

  if (favorite === "true") {
    searchParams.set("favorite", "true");
  }

  if (order && VALID_ORDERS.has(order) && order !== "updated_at_desc") {
    searchParams.set("order", order);
  }

  if (nextTagId) {
    searchParams.set("tag", nextTagId);
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
