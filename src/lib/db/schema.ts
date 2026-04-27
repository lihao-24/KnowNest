import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  KnowledgeSpace,
  KnowledgeStatus,
  KnowledgeType,
} from "../../types/knowledge";

export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
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
});
