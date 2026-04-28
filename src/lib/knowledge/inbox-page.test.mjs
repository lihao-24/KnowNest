import assert from "node:assert/strict";

const {
  buildInboxKnowledgeListParams,
  inboxKnowledgeListEmptyState,
  inboxPageHeader,
} = await import("./inbox-page.ts");

assert.deepEqual(buildInboxKnowledgeListParams(), {
  status: "inbox",
});

assert.deepEqual(inboxPageHeader, {
  eyebrow: "收集箱",
  title: "收集箱",
  description: "临时保存的内容，可以稍后整理。",
});

assert.deepEqual(inboxKnowledgeListEmptyState, {
  title: "收集箱是空的",
  description:
    "这里保存的是还没有整理的内容。你可以先快速记录，之后再补充空间、类型和标签。",
  actionLabel: "新建知识",
});
