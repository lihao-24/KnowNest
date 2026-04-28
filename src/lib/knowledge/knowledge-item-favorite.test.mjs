import assert from "node:assert/strict";

import {
  buildKnowledgeItemFavoriteRevalidationPaths,
  buildKnowledgeItemFavoritePayload,
  getKnowledgeItemFavoriteButtonLabel,
  getKnowledgeItemFavoriteStatusLabel,
  INVALID_KNOWLEDGE_ITEM_FAVORITE_MESSAGE,
} from "./knowledge-item-favorite.ts";

const favoriteFormData = new FormData();
favoriteFormData.set("userId", "forged-user-id");
favoriteFormData.set("itemId", "forged-item-id");
favoriteFormData.set("nextValue", "true");

const favoritePayload = buildKnowledgeItemFavoritePayload(
  "bound-item-id",
  favoriteFormData,
);

assert.deepEqual(favoritePayload, {
  ok: true,
  value: {
    itemId: "bound-item-id",
    nextValue: true,
  },
});
assert.equal(Object.hasOwn(favoritePayload.value, "userId"), false);

const unfavoriteFormData = new FormData();
unfavoriteFormData.set("nextValue", "false");

assert.deepEqual(
  buildKnowledgeItemFavoritePayload("bound-item-id", unfavoriteFormData),
  {
    ok: true,
    value: {
      itemId: "bound-item-id",
      nextValue: false,
    },
  },
);

const invalidFormData = new FormData();
invalidFormData.set("nextValue", "yes");

assert.deepEqual(
  buildKnowledgeItemFavoritePayload("bound-item-id", invalidFormData),
  {
    ok: false,
    error: INVALID_KNOWLEDGE_ITEM_FAVORITE_MESSAGE,
  },
);

assert.equal(getKnowledgeItemFavoriteButtonLabel(false, false), "收藏");
assert.equal(getKnowledgeItemFavoriteButtonLabel(true, false), "取消收藏");
assert.equal(getKnowledgeItemFavoriteButtonLabel(false, true), "处理中...");
assert.equal(getKnowledgeItemFavoriteStatusLabel(false), "未收藏");
assert.equal(getKnowledgeItemFavoriteStatusLabel(true), "已收藏");
assert.deepEqual(buildKnowledgeItemFavoriteRevalidationPaths(), [
  "/app",
  "/app/favorites",
]);
