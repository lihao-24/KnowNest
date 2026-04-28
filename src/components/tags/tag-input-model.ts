export function addTagValue(tags: string[], rawTagName: string): string[] {
  const tagName = rawTagName.trim();

  if (!tagName || tags.includes(tagName)) {
    return tags;
  }

  return [...tags, tagName];
}

export function removeTagValue(tags: string[], tagName: string): string[] {
  if (!tags.includes(tagName)) {
    return tags;
  }

  return tags.filter((tag) => tag !== tagName);
}
