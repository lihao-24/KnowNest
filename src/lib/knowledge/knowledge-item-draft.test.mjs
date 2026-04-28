import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

import {
  KNOWLEDGE_SPACES,
  KNOWLEDGE_STATUSES,
  KNOWLEDGE_TYPES,
} from "../../constants/knowledge.ts";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code === "ERR_MODULE_NOT_FOUND" &&
        specifier.startsWith("../") &&
        !specifier.endsWith(".ts")
      ) {
        return nextResolve(`${specifier}.ts`, context);
      }

      throw error;
    }
  },
});

const {
  EMPTY_KNOWLEDGE_ITEM_MESSAGE,
  buildKnowledgeItemDraftPayload,
  validateKnowledgeItemDraft,
} = await import("./knowledge-item-draft.ts");

const draftSource = readFileSync(
  new URL("./knowledge-item-draft.ts", import.meta.url),
  "utf8",
);

assert.ok(!draftSource.includes("allowedKnowledgeSpaces"));
assert.ok(!draftSource.includes("allowedKnowledgeTypes"));
assert.ok(!draftSource.includes("allowedKnowledgeStatuses"));

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

for (const space of KNOWLEDGE_SPACES) {
  assert.equal(
    validateKnowledgeItemDraft({
      title: "有效元信息",
      content: "",
      space: space.value,
      type: "note",
      status: "inbox",
    }).ok,
    true,
  );
}

for (const type of KNOWLEDGE_TYPES) {
  assert.equal(
    validateKnowledgeItemDraft({
      title: "有效元信息",
      content: "",
      space: "work",
      type: type.value,
      status: "inbox",
    }).ok,
    true,
  );
}

for (const status of KNOWLEDGE_STATUSES) {
  assert.equal(
    validateKnowledgeItemDraft({
      title: "有效元信息",
      content: "",
      space: "work",
      type: "note",
      status: status.value,
    }).ok,
    true,
  );
}

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
