import type { Tag } from "./tags";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type KnowledgeSpace = "life" | "work";

export type KnowledgeStatus = "inbox" | "organized" | "archived";

export type KnowledgeType =
  | "note"
  | "link"
  | "prompt"
  | "project"
  | "log"
  | "excerpt"
  | "plan"
  | "snippet";

export type KnowledgeItem = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  space: KnowledgeSpace;
  type: KnowledgeType;
  status: KnowledgeStatus;
  source_url: string | null;
  is_favorite: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
};

export type KnowledgeItemWithCategory = KnowledgeItem & {
  category: Category | null;
};

export type KnowledgeItemWithTags = KnowledgeItem & {
  tags: Tag[];
};

export type KnowledgeItemWithMetadata = KnowledgeItemWithCategory & {
  tags: Tag[];
};
