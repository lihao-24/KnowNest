type KnowledgeSearchParams = {
  q?: string | string[] | undefined;
  tag?: string | string[] | undefined;
};

export function getSearchKeyword(
  searchParams: KnowledgeSearchParams | undefined,
): string | undefined {
  return getFirstTrimmedParam(searchParams?.q);
}

export function buildKnowledgeSearchClearHref({
  currentSearchParams,
}: {
  currentSearchParams: KnowledgeSearchParams | undefined;
}) {
  const searchParams = new URLSearchParams();
  const selectedTagId = getFirstTrimmedParam(currentSearchParams?.tag);

  if (selectedTagId) {
    searchParams.set("tag", selectedTagId);
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
