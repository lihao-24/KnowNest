import {
  and,
  desc,
  eq,
  ilike,
  ne,
  or,
  type SQL,
} from "drizzle-orm";

import type {
  KnowledgeItem,
  KnowledgeSpace,
  KnowledgeStatus,
  KnowledgeType,
} from "../../types/knowledge";

export type ListKnowledgeItemsParams = {
  keyword?: string;
  space?: KnowledgeSpace;
  status?: KnowledgeStatus;
  type?: KnowledgeType;
  isFavorite?: boolean;
  includeArchived?: boolean;
};

export type NormalizedKnowledgeItemFilters = {
  userId: string;
  keyword?: string;
  space?: KnowledgeSpace;
  status?: KnowledgeStatus;
  type?: KnowledgeType;
  isFavorite?: boolean;
  includeArchived: boolean;
  statusesExcluded: KnowledgeStatus[];
  orderBy: "updated_at_desc";
};

export type CreateKnowledgeItemInput = {
  title?: string;
  content?: string;
  space?: KnowledgeSpace;
  type?: KnowledgeType;
  status?: KnowledgeStatus;
  source_url?: string | null;
  is_favorite?: boolean;
};

export type CreateKnowledgeItemValues = Required<
  Pick<
    KnowledgeItem,
    "user_id" | "title" | "content" | "space" | "type" | "status" | "is_favorite"
  >
> &
  Pick<KnowledgeItem, "source_url">;

export type UpdateKnowledgeItemInput = Partial<
  Pick<
    KnowledgeItem,
    | "title"
    | "content"
    | "space"
    | "type"
    | "status"
    | "source_url"
    | "is_favorite"
  >
>;

export type UpdateKnowledgeItemValues = Partial<
  Pick<
    KnowledgeItem,
    | "title"
    | "content"
    | "space"
    | "type"
    | "status"
    | "source_url"
    | "is_favorite"
  >
>;

export function buildKnowledgeItemFilters(
  userId: string,
  params: ListKnowledgeItemsParams = {},
): NormalizedKnowledgeItemFilters {
  const keyword = params.keyword?.trim();
  const includeArchived = params.includeArchived === true;
  const shouldExcludeArchived = !includeArchived && params.status === undefined;

  return {
    userId,
    keyword: keyword ? keyword : undefined,
    space: params.space,
    status: params.status,
    type: params.type,
    isFavorite: params.isFavorite,
    includeArchived,
    statusesExcluded: shouldExcludeArchived ? ["archived"] : [],
    orderBy: "updated_at_desc",
  };
}

export function normalizeCreateKnowledgeItemInput(
  userId: string,
  input: CreateKnowledgeItemInput,
): CreateKnowledgeItemValues {
  return {
    user_id: userId,
    title: input.title || "未命名内容",
    content: input.content || "",
    space: input.space || "work",
    type: input.type || "note",
    status: input.status || "inbox",
    source_url: normalizeNullableText(input.source_url),
    is_favorite: input.is_favorite ?? false,
  };
}

export function normalizeUpdateKnowledgeItemInput(
  input: UpdateKnowledgeItemInput,
): UpdateKnowledgeItemValues {
  const values: UpdateKnowledgeItemValues = {};

  if (input.title !== undefined) {
    values.title = input.title;
  }

  if (input.content !== undefined) {
    values.content = input.content;
  }

  if (input.space !== undefined) {
    values.space = input.space;
  }

  if (input.type !== undefined) {
    values.type = input.type;
  }

  if (input.status !== undefined) {
    values.status = input.status;
  }

  if (input.source_url !== undefined) {
    values.source_url = normalizeNullableText(input.source_url);
  }

  if (input.is_favorite !== undefined) {
    values.is_favorite = input.is_favorite;
  }

  return values;
}

export async function listKnowledgeItems(
  userId: string,
  params: ListKnowledgeItemsParams = {},
): Promise<KnowledgeItem[]> {
  const { db } = await import("./client");
  const { knowledgeItems } = await import("./schema");
  const filters = buildKnowledgeItemFilters(userId, params);

  return db
    .select()
    .from(knowledgeItems)
    .where(buildKnowledgeItemWhereClause(knowledgeItems, filters))
    .orderBy(desc(knowledgeItems.updated_at));
}

export async function getKnowledgeItemById(
  userId: string,
  id: string,
): Promise<KnowledgeItem | null> {
  const { db } = await import("./client");
  const { knowledgeItems } = await import("./schema");
  const rows = await db
    .select()
    .from(knowledgeItems)
    .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.user_id, userId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function createKnowledgeItem(
  userId: string,
  input: CreateKnowledgeItemInput,
): Promise<KnowledgeItem> {
  const { db } = await import("./client");
  const { knowledgeItems } = await import("./schema");
  const rows = await db
    .insert(knowledgeItems)
    .values(normalizeCreateKnowledgeItemInput(userId, input))
    .returning();

  return rows[0];
}

export async function updateKnowledgeItem(
  userId: string,
  id: string,
  input: UpdateKnowledgeItemInput,
): Promise<KnowledgeItem | null> {
  const { db } = await import("./client");
  const { knowledgeItems } = await import("./schema");
  const values = normalizeUpdateKnowledgeItemInput(input);

  if (Object.keys(values).length === 0) {
    throw new Error("No knowledge item fields provided for update.");
  }

  const rows = await db
    .update(knowledgeItems)
    .set(values)
    .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.user_id, userId)))
    .returning();

  return rows[0] ?? null;
}

export async function deleteKnowledgeItem(
  userId: string,
  id: string,
): Promise<boolean> {
  const { db } = await import("./client");
  const { knowledgeItems } = await import("./schema");
  const rows = await db
    .delete(knowledgeItems)
    .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.user_id, userId)))
    .returning({ id: knowledgeItems.id });

  return rows.length > 0;
}

export async function toggleFavorite(
  userId: string,
  id: string,
  isFavorite: boolean,
): Promise<KnowledgeItem | null> {
  return updateKnowledgeItem(userId, id, { is_favorite: isFavorite });
}

function normalizeNullableText(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildKnowledgeItemWhereClause(
  knowledgeItems: typeof import("./schema").knowledgeItems,
  filters: NormalizedKnowledgeItemFilters,
): SQL {
  const conditions: SQL[] = [eq(knowledgeItems.user_id, filters.userId)];

  if (filters.statusesExcluded.includes("archived")) {
    conditions.push(ne(knowledgeItems.status, "archived"));
  }

  if (filters.keyword) {
    const searchPattern = `%${filters.keyword}%`;
    conditions.push(
      or(
        ilike(knowledgeItems.title, searchPattern),
        ilike(knowledgeItems.content, searchPattern),
      )!,
    );
  }

  if (filters.space) {
    conditions.push(eq(knowledgeItems.space, filters.space));
  }

  if (filters.status) {
    conditions.push(eq(knowledgeItems.status, filters.status));
  }

  if (filters.type) {
    conditions.push(eq(knowledgeItems.type, filters.type));
  }

  if (filters.isFavorite !== undefined) {
    conditions.push(eq(knowledgeItems.is_favorite, filters.isFavorite));
  }

  return and(...conditions)!;
}
