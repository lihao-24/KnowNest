import assert from "node:assert/strict";

const {
  buildFavoritesKnowledgeListParams,
  favoritesKnowledgeListEmptyState,
  favoritesPageHeader,
} = await import("./favorites-page.ts");

assert.deepEqual(buildFavoritesKnowledgeListParams(), {
  isFavorite: true,
});

assert.deepEqual(favoritesPageHeader, {
  eyebrow: "收藏",
  title: "收藏",
  description: "集中查看你标记为重要的知识内容。",
});

assert.deepEqual(favoritesKnowledgeListEmptyState, {
  title: "还没有收藏内容",
  description: "收藏重要内容后，它们会集中出现在这里，方便之后快速回看。",
  actionLabel: "新建知识",
});
