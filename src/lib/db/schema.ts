import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  KnowledgeSpace,
  KnowledgeStatus,
  KnowledgeType,
} from "../../types/knowledge";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  display_name: text("display_name"),
  created_at: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", {
    mode: "string",
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const knowledgeItems = pgTable(
  "knowledge_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("未命名内容"),
    content: text("content").notNull().default(""),
    space: text("space").notNull().$type<KnowledgeSpace>().default("work"),
    type: text("type").notNull().$type<KnowledgeType>().default("note"),
    status: text("status").notNull().$type<KnowledgeStatus>().default("inbox"),
    source_url: text("source_url"),
    is_favorite: boolean("is_favorite").notNull().default(false),
    created_at: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", {
      mode: "string",
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    unique("knowledge_items_id_user_id_unique").on(table.id, table.user_id),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    created_at: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", {
      mode: "string",
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    check("tags_name_not_empty", sql`length(trim(${table.name})) > 0`),
    unique("tags_user_id_name_unique").on(table.user_id, table.name),
    unique("tags_id_user_id_unique").on(table.id, table.user_id),
  ],
);

export const knowledgeItemTags = pgTable(
  "knowledge_item_tags",
  {
    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    item_id: uuid("item_id").notNull(),
    tag_id: uuid("tag_id").notNull(),
    created_at: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.item_id, table.tag_id],
      name: "knowledge_item_tags_item_id_tag_id_pk",
    }),
    foreignKey({
      columns: [table.item_id, table.user_id],
      foreignColumns: [knowledgeItems.id, knowledgeItems.user_id],
      name: "knowledge_item_tags_item_user_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tag_id, table.user_id],
      foreignColumns: [tags.id, tags.user_id],
      name: "knowledge_item_tags_tag_user_fk",
    }).onDelete("cascade"),
  ],
);
