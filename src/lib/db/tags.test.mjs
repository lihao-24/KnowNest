import assert from "node:assert/strict";

import { getTableConfig } from "drizzle-orm/pg-core";

import {
  buildItemTagLinkValues,
  normalizeTagName,
  normalizeTagNames,
} from "./tags.ts";
import * as schema from "./schema.ts";

assert.ok(schema.tags);
assert.ok(schema.knowledgeItemTags);

const tagsConfig = getTableConfig(schema.tags);
const tagUserIdForeignKey = tagsConfig.foreignKeys.find((foreignKey) => {
  const reference = foreignKey.reference();

  return (
    reference.columns.includes(schema.tags.user_id) &&
    reference.foreignTable === schema.profiles &&
    reference.foreignColumns.includes(schema.profiles.id)
  );
});

assert.equal(tagUserIdForeignKey?.onDelete, "cascade");

const tagUserNameUnique = tagsConfig.uniqueConstraints.find(
  (constraint) => constraint.name === "tags_user_id_name_unique",
);
assert.ok(tagUserNameUnique);

const tagNameNotEmptyCheck = tagsConfig.checks.find(
  (constraint) => constraint.name === "tags_name_not_empty",
);
assert.ok(tagNameNotEmptyCheck);

const itemTagsConfig = getTableConfig(schema.knowledgeItemTags);
const itemTagPrimaryKey = itemTagsConfig.primaryKeys.find(
  (primaryKey) => primaryKey.getName() === "knowledge_item_tags_item_id_tag_id_pk",
);
assert.ok(itemTagPrimaryKey);

const itemTagForeignKeys = itemTagsConfig.foreignKeys.map((foreignKey) =>
  foreignKey.reference(),
);

assert.ok(
  itemTagForeignKeys.some(
    (reference) =>
      reference.foreignTable === schema.knowledgeItems &&
      hasColumnNames(reference.columns, ["item_id", "user_id"]) &&
      hasColumnNames(reference.foreignColumns, ["id", "user_id"]),
  ),
);

assert.ok(
  itemTagForeignKeys.some(
    (reference) =>
      reference.foreignTable === schema.tags &&
      hasColumnNames(reference.columns, ["tag_id", "user_id"]) &&
      hasColumnNames(reference.foreignColumns, ["id", "user_id"]),
  ),
);

assert.equal(normalizeTagName("  reading  "), "reading");

assert.throws(
  () => normalizeTagName("   "),
  /Tag name cannot be empty\./,
);

assert.deepEqual(
  normalizeTagNames([" work ", "", "life", "work", "  ", "life", "prompt "]),
  ["work", "life", "prompt"],
);

assert.deepEqual(
  buildItemTagLinkValues("user-1", "item-1", [
    { id: "tag-1", user_id: "user-1", name: "work" },
    { id: "tag-2", user_id: "user-1", name: "life" },
  ]),
  [
    { user_id: "user-1", item_id: "item-1", tag_id: "tag-1" },
    { user_id: "user-1", item_id: "item-1", tag_id: "tag-2" },
  ],
);

assert.throws(
  () =>
    buildItemTagLinkValues("user-1", "item-1", [
      { id: "tag-2", user_id: "user-2", name: "life" },
    ]),
  /Cannot bind a tag that belongs to another user\./,
);

function hasColumnNames(columns, names) {
  const columnNames = columns.map((column) => column.name);

  return names.every((name) => columnNames.includes(name));
}
