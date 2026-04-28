import assert from "node:assert/strict";

import { getTableConfig } from "drizzle-orm/pg-core";

import {
  buildKnowledgeItemFilters,
  normalizeCreateKnowledgeItemInput,
  normalizeUpdateKnowledgeItemInput,
} from "./knowledge-items.ts";
import * as schema from "./schema.ts";

assert.ok(schema.profiles);

const userIdForeignKey = getTableConfig(schema.knowledgeItems).foreignKeys.find(
  (foreignKey) => {
    const reference = foreignKey.reference();

    return (
      reference.columns.includes(schema.knowledgeItems.user_id) &&
      reference.foreignTable === schema.profiles &&
      reference.foreignColumns.includes(schema.profiles.id)
    );
  },
);

assert.equal(userIdForeignKey?.onDelete, "cascade");

const defaultFilters = buildKnowledgeItemFilters("user-1");

assert.equal(defaultFilters.userId, "user-1");
assert.deepEqual(defaultFilters.statusesExcluded, ["archived"]);
assert.equal(defaultFilters.orderBy, "updated_at_desc");

const archivedOnlyFilters = buildKnowledgeItemFilters("user-1", {
  status: "archived",
});

assert.equal(archivedOnlyFilters.status, "archived");
assert.deepEqual(archivedOnlyFilters.statusesExcluded, []);

const archivedFilters = buildKnowledgeItemFilters("user-1", {
  includeArchived: true,
  keyword: "  drizzle  ",
  space: "work",
  status: "archived",
  tagId: "  tag-1  ",
  type: "note",
  isFavorite: true,
});

assert.equal(archivedFilters.keyword, "drizzle");
assert.equal(archivedFilters.space, "work");
assert.equal(archivedFilters.status, "archived");
assert.equal(archivedFilters.tagId, "tag-1");
assert.equal(archivedFilters.type, "note");
assert.equal(archivedFilters.isFavorite, true);
assert.equal(archivedFilters.includeArchived, true);
assert.deepEqual(archivedFilters.statusesExcluded, []);

const emptyTagFilters = buildKnowledgeItemFilters("user-1", {
  tagId: "   ",
});

assert.equal(emptyTagFilters.tagId, undefined);

const createPayload = normalizeCreateKnowledgeItemInput("user-1", {
  user_id: "other-user",
  title: "",
  content: undefined,
  source_url: "",
});

assert.equal(createPayload.user_id, "user-1");
assert.equal(createPayload.title, "未命名内容");
assert.equal(createPayload.content, "");
assert.equal(createPayload.space, "work");
assert.equal(createPayload.type, "note");
assert.equal(createPayload.status, "inbox");
assert.equal(createPayload.source_url, null);
assert.equal(createPayload.is_favorite, false);

const updatePayload = normalizeUpdateKnowledgeItemInput({
  title: "  kept whitespace  ",
  source_url: "   ",
  is_favorite: true,
});

assert.deepEqual(updatePayload, {
  title: "  kept whitespace  ",
  source_url: null,
  is_favorite: true,
});
