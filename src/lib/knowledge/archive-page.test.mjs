import assert from "node:assert/strict";

const {
  archiveKnowledgeListEmptyState,
  archivePageHeader,
  buildArchiveKnowledgeListParams,
} = await import("./archive-page.ts");

assert.deepEqual(buildArchiveKnowledgeListParams(), {
  status: "archived",
});

assert.deepEqual(archivePageHeader, {
  eyebrow: "归档",
  title: "归档",
  description: "查看已经归档的知识内容。",
});

assert.deepEqual(archiveKnowledgeListEmptyState, {
  title: "归档是空的",
  description: "归档后的内容会集中出现在这里，默认不会显示在全部内容页。",
  actionLabel: "新建知识",
});
