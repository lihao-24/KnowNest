import {
  and,
  asc,
  eq,
  inArray,
} from "drizzle-orm";

import type { Category, KnowledgeItem, KnowledgeItemWithCategory } from "../../types/knowledge";

export const DEFAULT_CATEGORY_NAMES = [
  "工作",
  "学习",
  "生活",
  "项目",
  "灵感",
  "其他",
] as const;

export type CategoryValues = {
  user_id: string;
  name: string;
};

export function normalizeCategoryName(name: string): string {
  const normalized = name.trim();

  if (!normalized) {
    throw new Error("Category name cannot be empty.");
  }

  return normalized;
}

export function buildDefaultCategoryValues(userId: string): CategoryValues[] {
  return DEFAULT_CATEGORY_NAMES.map((name) => ({
    user_id: userId,
    name,
  }));
}

export async function ensureDefaultCategories(userId: string): Promise<void> {
  const { db } = await import("./client");
  const { categories } = await import("./schema");

  await db
    .insert(categories)
    .values(buildDefaultCategoryValues(userId))
    .onConflictDoNothing({
      target: [categories.user_id, categories.name],
    });
}

export async function listCategories(userId: string): Promise<Category[]> {
  const { db } = await import("./client");
  const { categories } = await import("./schema");

  return db
    .select()
    .from(categories)
    .where(eq(categories.user_id, userId))
    .orderBy(asc(categories.name));
}

export async function listCategoriesEnsuringDefaults(
  userId: string,
): Promise<Category[]> {
  await ensureDefaultCategories(userId);

  return listCategories(userId);
}

export async function createCategory(
  userId: string,
  name: string,
): Promise<Category> {
  const { db } = await import("./client");
  const { categories } = await import("./schema");
  const normalizedName = normalizeCategoryName(name);

  const insertedRows = await db
    .insert(categories)
    .values({ user_id: userId, name: normalizedName })
    .onConflictDoNothing({
      target: [categories.user_id, categories.name],
    })
    .returning();

  if (insertedRows[0]) {
    return insertedRows[0];
  }

  const existingRows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.user_id, userId), eq(categories.name, normalizedName)))
    .limit(1);

  if (!existingRows[0]) {
    throw new Error("Failed to create or load category.");
  }

  return existingRows[0];
}

export async function getCategoryById(
  userId: string,
  categoryId: string,
): Promise<Category | null> {
  const { db } = await import("./client");
  const { categories } = await import("./schema");

  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.user_id, userId), eq(categories.id, categoryId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function resolveKnowledgeItemCategoryId(
  userId: string,
  input: {
    categoryId?: string | null;
    categoryName?: string | null;
  },
): Promise<string | null> {
  const categoryName = input.categoryName?.trim();

  if (categoryName) {
    return (await createCategory(userId, categoryName)).id;
  }

  const categoryId = input.categoryId?.trim();

  if (!categoryId) {
    return null;
  }

  const category = await getCategoryById(userId, categoryId);

  return category?.id ?? null;
}

export async function attachCategoriesToKnowledgeItems(
  userId: string,
  items: KnowledgeItem[],
): Promise<KnowledgeItemWithCategory[]> {
  const categoryIds = Array.from(
    new Set(
      items
        .map((item) => item.category_id)
        .filter((categoryId): categoryId is string => Boolean(categoryId)),
    ),
  );

  if (categoryIds.length === 0) {
    return items.map((item) => ({ ...item, category: null }));
  }

  const { db } = await import("./client");
  const { categories } = await import("./schema");
  const categoryRows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.user_id, userId), inArray(categories.id, categoryIds)));
  const categoryById = new Map(categoryRows.map((category) => [category.id, category]));

  return items.map((item) => ({
    ...item,
    category: item.category_id ? categoryById.get(item.category_id) ?? null : null,
  }));
}
