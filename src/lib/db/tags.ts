import {
  and,
  asc,
  eq,
} from "drizzle-orm";

import type { Tag } from "../../types/tags";

export type ItemTagLinkValues = {
  user_id: string;
  item_id: string;
  tag_id: string;
};

export function normalizeTagName(name: string): string {
  const normalized = name.trim();

  if (!normalized) {
    throw new Error("Tag name cannot be empty.");
  }

  return normalized;
}

export function normalizeTagNames(names: string[]): string[] {
  const normalizedNames: string[] = [];
  const seenNames = new Set<string>();

  for (const name of names) {
    const normalized = name.trim();

    if (!normalized || seenNames.has(normalized)) {
      continue;
    }

    seenNames.add(normalized);
    normalizedNames.push(normalized);
  }

  return normalizedNames;
}

export function buildItemTagLinkValues(
  userId: string,
  itemId: string,
  itemTags: Pick<Tag, "id" | "user_id">[],
): ItemTagLinkValues[] {
  return itemTags.map((tag) => {
    if (tag.user_id !== userId) {
      throw new Error("Cannot bind a tag that belongs to another user.");
    }

    return {
      user_id: userId,
      item_id: itemId,
      tag_id: tag.id,
    };
  });
}

export async function listTags(userId: string): Promise<Tag[]> {
  const { db } = await import("./client");
  const { tags } = await import("./schema");

  return db
    .select()
    .from(tags)
    .where(eq(tags.user_id, userId))
    .orderBy(asc(tags.name));
}

export async function createTag(userId: string, name: string): Promise<Tag> {
  const { db } = await import("./client");
  const { tags } = await import("./schema");
  const normalizedName = normalizeTagName(name);

  const insertedRows = await db
    .insert(tags)
    .values({ user_id: userId, name: normalizedName })
    .onConflictDoNothing({
      target: [tags.user_id, tags.name],
    })
    .returning();

  if (insertedRows[0]) {
    return insertedRows[0];
  }

  const existingRows = await db
    .select()
    .from(tags)
    .where(and(eq(tags.user_id, userId), eq(tags.name, normalizedName)))
    .limit(1);

  if (!existingRows[0]) {
    throw new Error("Failed to create or load tag.");
  }

  return existingRows[0];
}

export async function getOrCreateTags(
  userId: string,
  names: string[],
): Promise<Tag[]> {
  const normalizedNames = normalizeTagNames(names);

  if (normalizedNames.length === 0) {
    return [];
  }

  const createdOrExistingTags = await Promise.all(
    normalizedNames.map((name) => createTag(userId, name)),
  );
  const tagsByName = new Map(
    createdOrExistingTags.map((tag) => [tag.name, tag]),
  );

  return normalizedNames.map((name) => tagsByName.get(name)!);
}

export async function listTagsByItemId(
  userId: string,
  itemId: string,
): Promise<Tag[]> {
  const { db } = await import("./client");
  const { knowledgeItemTags, tags } = await import("./schema");

  return db
    .select({
      id: tags.id,
      user_id: tags.user_id,
      name: tags.name,
      created_at: tags.created_at,
      updated_at: tags.updated_at,
    })
    .from(knowledgeItemTags)
    .innerJoin(
      tags,
      and(
        eq(knowledgeItemTags.tag_id, tags.id),
        eq(knowledgeItemTags.user_id, tags.user_id),
      ),
    )
    .where(
      and(
        eq(knowledgeItemTags.user_id, userId),
        eq(knowledgeItemTags.item_id, itemId),
        eq(tags.user_id, userId),
      ),
    )
    .orderBy(asc(tags.name));
}

export async function updateItemTags(
  userId: string,
  itemId: string,
  tagNames: string[],
): Promise<Tag[]> {
  const { db } = await import("./client");
  const { knowledgeItems, knowledgeItemTags, tags } = await import("./schema");
  const normalizedNames = normalizeTagNames(tagNames);

  return db.transaction(async (tx) => {
    const itemRows = await tx
      .select({ id: knowledgeItems.id })
      .from(knowledgeItems)
      .where(
        and(eq(knowledgeItems.id, itemId), eq(knowledgeItems.user_id, userId)),
      )
      .limit(1);

    if (!itemRows[0]) {
      throw new Error("Knowledge item not found for current user.");
    }

    const itemTags: Tag[] = [];

    for (const name of normalizedNames) {
      const insertedRows = await tx
        .insert(tags)
        .values({ user_id: userId, name })
        .onConflictDoNothing({
          target: [tags.user_id, tags.name],
        })
        .returning();

      if (insertedRows[0]) {
        itemTags.push(insertedRows[0]);
        continue;
      }

      const existingRows = await tx
        .select()
        .from(tags)
        .where(and(eq(tags.user_id, userId), eq(tags.name, name)))
        .limit(1);

      if (!existingRows[0]) {
        throw new Error("Failed to create or load tag.");
      }

      itemTags.push(existingRows[0]);
    }

    await tx
      .delete(knowledgeItemTags)
      .where(
        and(
          eq(knowledgeItemTags.user_id, userId),
          eq(knowledgeItemTags.item_id, itemId),
        ),
      );

    const linkValues = buildItemTagLinkValues(userId, itemId, itemTags);

    if (linkValues.length > 0) {
      await tx
        .insert(knowledgeItemTags)
        .values(linkValues)
        .onConflictDoNothing({
          target: [knowledgeItemTags.item_id, knowledgeItemTags.tag_id],
        });
    }

    return itemTags;
  });
}
