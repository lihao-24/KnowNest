type TagFilterSearchParams = {
  tag?: string | string[] | undefined;
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
  nextTagId,
}: {
  currentTagId: string | undefined;
  nextTagId: string | undefined;
}) {
  if (!nextTagId) {
    return "/app";
  }

  const searchParams = new URLSearchParams();
  searchParams.set("tag", nextTagId);

  return `/app?${searchParams.toString()}`;
}
