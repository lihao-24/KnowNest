import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getTableConfig } from "drizzle-orm/pg-core";

import {
  DEFAULT_CATEGORY_NAMES,
  buildDefaultCategoryValues,
  normalizeCategoryName,
} from "./categories.ts";
import * as schema from "./schema.ts";

assert.ok(schema.categories);

const categoriesConfig = getTableConfig(schema.categories);
const categoryUserIdForeignKey = categoriesConfig.foreignKeys.find((foreignKey) => {
  const reference = foreignKey.reference();

  return (
    reference.columns.includes(schema.categories.user_id) &&
    reference.foreignTable === schema.profiles &&
    reference.foreignColumns.includes(schema.profiles.id)
  );
});

assert.equal(categoryUserIdForeignKey?.onDelete, "cascade");

const categoryUserNameUnique = categoriesConfig.uniqueConstraints.find(
  (constraint) => constraint.name === "categories_user_id_name_unique",
);
assert.ok(categoryUserNameUnique);

const categoryNameNotEmptyCheck = categoriesConfig.checks.find(
  (constraint) => constraint.name === "categories_name_not_empty",
);
assert.ok(categoryNameNotEmptyCheck);

const knowledgeItemsConfig = getTableConfig(schema.knowledgeItems);
const itemCategoryForeignKey = knowledgeItemsConfig.foreignKeys.find((foreignKey) => {
  const reference = foreignKey.reference();
  const columnNames = reference.columns.map((column) => column.name);
  const foreignColumnNames = reference.foreignColumns.map((column) => column.name);

  return (
    columnNames.includes("category_id") &&
    columnNames.includes("user_id") &&
    reference.foreignTable === schema.categories &&
    foreignColumnNames.includes("id") &&
    foreignColumnNames.includes("user_id")
  );
});

assert.ok(itemCategoryForeignKey);
assert.equal(itemCategoryForeignKey.onDelete, "set null");

assert.equal(normalizeCategoryName("  工作  "), "工作");

assert.throws(
  () => normalizeCategoryName("   "),
  /Category name cannot be empty\./,
);

assert.deepEqual(DEFAULT_CATEGORY_NAMES, [
  "工作",
  "学习",
  "生活",
  "项目",
  "灵感",
  "其他",
]);

assert.deepEqual(buildDefaultCategoryValues("user-1"), [
  { user_id: "user-1", name: "工作" },
  { user_id: "user-1", name: "学习" },
  { user_id: "user-1", name: "生活" },
  { user_id: "user-1", name: "项目" },
  { user_id: "user-1", name: "灵感" },
  { user_id: "user-1", name: "其他" },
]);

const categoriesSource = readFileSync(
  new URL("./categories.ts", import.meta.url),
  "utf8",
);

assert.match(
  categoriesSource,
  /export async function listCategoriesEnsuringDefaults/,
);
assert.match(
  categoriesSource,
  /listCategoriesEnsuringDefaults[\s\S]*await ensureDefaultCategories\(userId\);[\s\S]*return listCategories\(userId\);/,
);
assert.doesNotMatch(
  categoriesSource.match(
    /export async function listCategories\(userId: string\): Promise<Category\[]> \{[\s\S]*?\n\}/,
  )?.[0] ?? "",
  /ensureDefaultCategories/,
);
