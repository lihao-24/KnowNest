import assert from "node:assert/strict";

import {
  buildAIGenerateContext,
  parseAIGenerateRequest,
} from "./actions.ts";

assert.deepEqual(
  parseAIGenerateRequest({
    action: "generate_summary",
    knowledgeItemId: " item-1 ",
    title: " Title ",
    content: " Content ",
    modelId: " xiaomi-mimo-token-plan-pro ",
  }),
  {
    action: "generate_summary",
    knowledgeItemId: "item-1",
    title: "Title",
    content: "Content",
    modelId: "xiaomi-mimo-token-plan-pro",
  },
);

assert.deepEqual(
  parseAIGenerateRequest({
    action: "generate_summary",
    content: "Content",
    modelId: 123,
  }),
  {
    action: "generate_summary",
    content: "Content",
  },
);

assert.deepEqual(
  parseAIGenerateRequest({
    action: "generate_summary",
    content: "Content",
    modelId: "   ",
  }),
  {
    action: "generate_summary",
    content: "Content",
  },
);

assert.throws(
  () => parseAIGenerateRequest({ action: "unknown", content: "正文" }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "invalid_action" &&
    error.status === 400,
);

assert.throws(
  () => parseAIGenerateRequest({ action: "generate_summary" }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "invalid_request" &&
    error.status === 400,
);

assert.deepEqual(parseAIGenerateRequest({
  action: "suggest_tags",
  knowledgeItemId: "item-1",
}), {
  action: "suggest_tags",
  knowledgeItemId: "item-1",
});

const savedItem = {
  id: "item-1",
  user_id: "user-1",
  title: "Saved title",
  content: "Saved content",
  space: "work",
  type: "note",
  status: "inbox",
  source_url: null,
  is_favorite: false,
  category_id: null,
  summary: null,
  summary_generated_at: null,
  ai_updated_at: null,
  created_at: "2026-04-29T00:00:00.000Z",
  updated_at: "2026-04-29T00:00:00.000Z",
};

const context = await buildAIGenerateContext(
  "user-1",
  {
    action: "generate_summary",
    knowledgeItemId: "item-1",
    title: "Draft title",
    content: "Draft content",
  },
  {
    getKnowledgeItemById: async () => savedItem,
    listTagsByItemId: async () => [
      { id: "tag-1", user_id: "user-1", name: "Supabase", created_at: "", updated_at: "" },
    ],
    listCategories: async () => [
      { id: "cat-1", user_id: "user-1", name: "项目", created_at: "", updated_at: "" },
    ],
  },
);

assert.deepEqual(context, {
  action: "generate_summary",
  knowledgeItemId: "item-1",
  title: "Draft title",
  content: "Draft content",
  existingTags: ["Supabase"],
  existingCategories: ["项目"],
});

const savedContext = await buildAIGenerateContext(
  "user-1",
  {
    action: "organize_content",
    knowledgeItemId: "item-1",
  },
  {
    getKnowledgeItemById: async () => savedItem,
    listTagsByItemId: async () => [],
    listCategories: async () => [],
  },
);

assert.equal(savedContext.title, "Saved title");
assert.equal(savedContext.content, "Saved content");

await assert.rejects(
  () =>
    buildAIGenerateContext(
      "user-1",
      { action: "generate_summary", knowledgeItemId: "missing" },
      {
        getKnowledgeItemById: async () => null,
        listTagsByItemId: async () => [],
        listCategories: async () => [],
      },
    ),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "forbidden" &&
    error.status === 403,
);
