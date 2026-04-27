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
    space: "work",
    type: "note",
    status: "inbox",
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
    space: "work",
    type: "note",
    status: "inbox",
  },
});

const formData = new FormData();
formData.set("title", "  编辑后的标题  ");
formData.set("content", "\n编辑后的正文\n");
formData.set("userId", "forged-user-id");
formData.set("space", "life");
formData.set("type", "snippet");
formData.set("status", "organized");

const updatePayload = buildKnowledgeItemDraftPayload(formData);

assert.deepEqual(updatePayload, {
  ok: true,
  value: {
    title: "编辑后的标题",
    content: "编辑后的正文",
    space: "life",
    type: "snippet",
    status: "organized",
  },
});

const forgedMetadataFormData = new FormData();
forgedMetadataFormData.set("title", "伪造元信息");
forgedMetadataFormData.set("space", "personal");
forgedMetadataFormData.set("type", "article");
forgedMetadataFormData.set("status", "deleted");

const forgedMetadataPayload = buildKnowledgeItemDraftPayload(
  forgedMetadataFormData,
);

assert.deepEqual(forgedMetadataPayload, {
  ok: false,
  error: "空间、类型或状态不正确。",
});
