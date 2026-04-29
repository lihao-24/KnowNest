import {
  and,
  asc,
  desc,
  eq,
  ilike,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import type {
  KnowledgeItem,
  KnowledgeSpace,
  KnowledgeStatus,
  KnowledgeType,
} from "../../types/knowledge";

export type ListKnowledgeItemsParams = {
  categoryId?: string;
  keyword?: string;
  orderBy?: string;
  space?: KnowledgeSpace;
  status?: KnowledgeStatus;
  type?: KnowledgeType;
  isFavorite?: boolean;
  tagId?: string;
  includeArchived?: boolean;
};

export type NormalizedKnowledgeItemFilters = {
  userId: string;
  categoryId?: string;
  keyword?: string;
  space?: KnowledgeSpace;
  status?: KnowledgeStatus;
  type?: KnowledgeType;
  isFavorite?: boolean;
  tagId?: string;
  includeArchived: boolean;
  statusesExcluded: KnowledgeStatus[];
  orderBy: KnowledgeItemsOrderBy;
};

export type KnowledgeItemsOrderBy =
  | "updated_at_desc"
  | "created_at_desc"
  | "created_at_asc";

export type CreateKnowledgeItemInput = {
  title?: string;
  content?: string;
  category_id?: string | null;
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
  Pick<KnowledgeItem, "source_url" | "category_id">;

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
    | "category_id"
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
    | "category_id"
  >
>;

export function buildKnowledgeItemFilters(
  userId: string,
  params: ListKnowledgeItemsParams = {},
): NormalizedKnowledgeItemFilters {
  const keyword = params.keyword?.trim();
  const categoryId = params.categoryId?.trim();
  const tagId = params.tagId?.trim();
  const includeArchived = params.includeArchived === true;
  const shouldExcludeArchived = !includeArchived && params.status === undefined;

  return {
    userId,
    categoryId: categoryId ? categoryId : undefined,
    keyword: keyword ? keyword : undefined,
    space: params.space,
    status: params.status,
    type: params.type,
    isFavorite: params.isFavorite,
    tagId: tagId ? tagId : undefined,
    includeArchived,
    statusesExcluded: shouldExcludeArchived ? ["archived"] : [],
    orderBy: normalizeKnowledgeItemsOrderBy(params.orderBy),
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
    category_id: input.category_id ?? null,
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

  if (input.category_id !== undefined) {
    values.category_id = input.category_id;
  }

  return values;
}

export async function listKnowledgeItems(
  userId: string,
  params: ListKnowledgeItemsParams = {},
): Promise<KnowledgeItem[]> {
  const { db } = await import("./client");
  const { knowledgeItems, knowledgeItemTags } = await import("./schema");
  const filters = buildKnowledgeItemFilters(userId, params);

  return db
    .select()
    .from(knowledgeItems)
    .where(buildKnowledgeItemWhereClause(knowledgeItems, knowledgeItemTags, filters))
    .orderBy(buildKnowledgeItemsOrderByClause(knowledgeItems, filters.orderBy));
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

function normalizeKnowledgeItemsOrderBy(
  orderBy: string | undefined,
): KnowledgeItemsOrderBy {
  return orderBy === "created_at_desc" || orderBy === "created_at_asc"
    ? orderBy
    : "updated_at_desc";
}

export function buildKnowledgeItemWhereClause(
  knowledgeItems: typeof import("./schema").knowledgeItems,
  knowledgeItemTags: typeof import("./schema").knowledgeItemTags,
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
        sql`exists (
          select 1
          from "tags"
          inner join ${knowledgeItemTags}
            on ${knowledgeItemTags.tag_id} = "tags"."id"
           and ${knowledgeItemTags.user_id} = "tags"."user_id"
          where ${knowledgeItemTags.item_id} = ${knowledgeItems.id}
            and ${knowledgeItemTags.user_id} = ${filters.userId}
            and "tags"."name" ilike ${searchPattern}
        )`,
      )!,
    );
  }

  if (filters.categoryId) {
    conditions.push(eq(knowledgeItems.category_id, filters.categoryId));
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

  if (filters.tagId) {
    conditions.push(
      sql`exists (
        select 1
        from ${knowledgeItemTags}
        where ${knowledgeItemTags.item_id} = ${knowledgeItems.id}
          and ${knowledgeItemTags.user_id} = ${filters.userId}
          and ${knowledgeItemTags.tag_id} = ${filters.tagId}
      )`,
    );
  }

  return and(...conditions)!;
}

function buildKnowledgeItemsOrderByClause(
  knowledgeItems: typeof import("./schema").knowledgeItems,
  orderBy: KnowledgeItemsOrderBy,
) {
  if (orderBy === "created_at_desc") {
    return desc(knowledgeItems.created_at);
  }

  if (orderBy === "created_at_asc") {
    return asc(knowledgeItems.created_at);
  }

  return desc(knowledgeItems.updated_at);
}
