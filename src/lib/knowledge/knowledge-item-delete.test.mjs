import assert from "node:assert/strict";

import {
  DELETE_KNOWLEDGE_ITEM_CONFIRMATION_MESSAGE,
  buildDeleteKnowledgeItemPayload,
  getDeleteKnowledgeItemConfirmationState,
  initialDeleteKnowledgeItemConfirmationState,
} from "./knowledge-item-delete.ts";

assert.equal(
  DELETE_KNOWLEDGE_ITEM_CONFIRMATION_MESSAGE,
  "确定要删除这条知识吗？此操作无法撤销。",
);

const requestedState = getDeleteKnowledgeItemConfirmationState(
  initialDeleteKnowledgeItemConfirmationState,
  "request",
);

assert.deepEqual(requestedState, {
  isConfirming: true,
});

const canceledState = getDeleteKnowledgeItemConfirmationState(
  requestedState,
  "cancel",
);

assert.deepEqual(canceledState, {
  isConfirming: false,
});

const formData = new FormData();
formData.set("userId", "forged-user-id");
formData.set("id", "forged-item-id");

const deletePayload = buildDeleteKnowledgeItemPayload("item-1", formData);

assert.deepEqual(deletePayload, {
  itemId: "item-1",
});
assert.equal(Object.hasOwn(deletePayload, "userId"), false);
