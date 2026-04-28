type TagFilterSearchParams = {
  tag?: string | string[] | undefined;
  q?: string | string[] | undefined;
};

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

  if (keyword) {
    searchParams.set("q", keyword);
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
