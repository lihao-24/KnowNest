import assert from "node:assert/strict";

import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";

import {
  buildKnowledgeItemWhereClause,
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

const metadataFilters = buildKnowledgeItemFilters("user-1", {
  keyword: "drizzle",
  space: "life",
  status: "organized",
  tagId: "tag-1",
  type: "link",
});

assert.equal(metadataFilters.space, "life");
assert.equal(metadataFilters.status, "organized");
assert.equal(metadataFilters.type, "link");
assert.deepEqual(metadataFilters.statusesExcluded, []);

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

const keywordAndTagSql = new PgDialect().sqlToQuery(
  buildKnowledgeItemWhereClause(
    schema.knowledgeItems,
    schema.knowledgeItemTags,
    buildKnowledgeItemFilters("user-1", {
      keyword: "  drizzle  ",
      tagId: "tag-1",
    }),
  ),
);

assert.match(
  keywordAndTagSql.sql,
  /"knowledge_items"\."user_id" = \$\d+/,
);
assert.match(keywordAndTagSql.sql, /"knowledge_items"\."status" <> \$\d+/);
assert.match(keywordAndTagSql.sql, /"knowledge_items"\."title" ilike \$\d+/);
assert.match(
  keywordAndTagSql.sql,
  /"knowledge_items"\."content" ilike \$\d+/,
);
assert.match(keywordAndTagSql.sql, /exists\s*\(/);
assert.deepEqual(keywordAndTagSql.params, [
  "user-1",
  "archived",
  "%drizzle%",
  "%drizzle%",
  "user-1",
  "tag-1",
]);

const metadataFilterSql = new PgDialect().sqlToQuery(
  buildKnowledgeItemWhereClause(
    schema.knowledgeItems,
    schema.knowledgeItemTags,
    metadataFilters,
  ),
);

assert.match(
  metadataFilterSql.sql,
  /"knowledge_items"\."user_id" = \$\d+/,
);
assert.doesNotMatch(
  metadataFilterSql.sql,
  /"knowledge_items"\."status" <> \$\d+/,
);
assert.match(metadataFilterSql.sql, /"knowledge_items"\."title" ilike \$\d+/);
assert.match(metadataFilterSql.sql, /"knowledge_items"\."space" = \$\d+/);
assert.match(metadataFilterSql.sql, /"knowledge_items"\."status" = \$\d+/);
assert.match(metadataFilterSql.sql, /"knowledge_items"\."type" = \$\d+/);
assert.match(metadataFilterSql.sql, /exists\s*\(/);
assert.deepEqual(metadataFilterSql.params, [
  "user-1",
  "%drizzle%",
  "%drizzle%",
  "life",
  "organized",
  "link",
  "user-1",
  "tag-1",
]);

const archivedStatusSql = new PgDialect().sqlToQuery(
  buildKnowledgeItemWhereClause(
    schema.knowledgeItems,
    schema.knowledgeItemTags,
    buildKnowledgeItemFilters("user-1", { status: "archived" }),
  ),
);

assert.doesNotMatch(
  archivedStatusSql.sql,
  /"knowledge_items"\."status" <> \$\d+/,
);
assert.match(archivedStatusSql.sql, /"knowledge_items"\."status" = \$\d+/);
assert.deepEqual(archivedStatusSql.params, ["user-1", "archived"]);

const tagFilterSql = new PgDialect().sqlToQuery(
  buildKnowledgeItemWhereClause(
    schema.knowledgeItems,
    schema.knowledgeItemTags,
    buildKnowledgeItemFilters("user-1", {
      includeArchived: true,
      tagId: "tag-1",
    }),
  ),
);

assert.match(tagFilterSql.sql, /exists\s*\(/);
assert.match(tagFilterSql.sql, /from "knowledge_item_tags"/);
assert.match(
  tagFilterSql.sql,
  /"knowledge_item_tags"\."item_id" = "knowledge_items"\."id"/,
);
assert.match(tagFilterSql.sql, /"knowledge_item_tags"\."user_id" = \$\d+/);
assert.match(tagFilterSql.sql, /"knowledge_item_tags"\."tag_id" = \$\d+/);
assert.deepEqual(tagFilterSql.params, ["user-1", "user-1", "tag-1"]);

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
