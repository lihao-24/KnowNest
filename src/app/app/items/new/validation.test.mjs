import assert from "node:assert/strict";

import {
  EMPTY_KNOWLEDGE_ITEM_MESSAGE,
  validateKnowledgeItemDraft,
} from "./validation.ts";

const emptyDraft = validateKnowledgeItemDraft({
  title: "   ",
  content: "\n\t ",
});

assert.deepEqual(emptyDraft, {
  ok: false,
  error: EMPTY_KNOWLEDGE_ITEM_MESSAGE,
});

const titleOnlyDraft = validateKnowledgeItemDraft({
  title: "只写标题",
  content: "",
});

assert.deepEqual(titleOnlyDraft, {
  ok: true,
  value: {
    title: "只写标题",
    content: "",
  },
});

const contentOnlyDraft = validateKnowledgeItemDraft({
  title: "",
  content: "只写正文",
});

assert.deepEqual(contentOnlyDraft, {
  ok: true,
  value: {
    title: "",
    content: "只写正文",
  },
});
