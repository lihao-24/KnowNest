import assert from "node:assert/strict";

import {
  EMPTY_KNOWLEDGE_ITEM_MESSAGE,
  buildKnowledgeItemDraftPayload,
  validateKnowledgeItemDraft,
} from "./knowledge-item-draft.ts";

const emptyDraft = validateKnowledgeItemDraft({
  title: "   ",
  content: "\n\t ",
});

assert.deepEqual(emptyDraft, {
  ok: false,
  error: EMPTY_KNOWLEDGE_ITEM_MESSAGE,
});

const titleOnlyDraft = validateKnowledgeItemDraft({
  title: "  只写标题  ",
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
  content: "  只写正文  ",
});

assert.deepEqual(contentOnlyDraft, {
  ok: true,
  value: {
    title: "",
    content: "只写正文",
  },
});

const formData = new FormData();
formData.set("title", "  编辑后的标题  ");
formData.set("content", "\n编辑后的正文\n");
formData.set("userId", "forged-user-id");
formData.set("status", "archived");

const updatePayload = buildKnowledgeItemDraftPayload(formData);

assert.deepEqual(updatePayload, {
  ok: true,
  value: {
    title: "编辑后的标题",
    content: "编辑后的正文",
  },
});
