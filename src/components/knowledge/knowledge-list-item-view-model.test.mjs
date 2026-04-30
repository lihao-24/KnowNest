import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

import {
  KNOWLEDGE_SPACES,
  KNOWLEDGE_STATUSES,
  KNOWLEDGE_TYPES,
} from "../../constants/knowledge.ts";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code === "ERR_MODULE_NOT_FOUND" &&
        specifier.startsWith("../") &&
        !specifier.endsWith(".ts")
      ) {
        return nextResolve(`${specifier}.ts`, context);
      }

      throw error;
    }
  },
});

const {
  buildKnowledgeListItemViewModel,
  DEFAULT_KNOWLEDGE_ITEM_TITLE,
} = await import("./knowledge-list-item-view-model.ts");

const viewModelSource = readFileSync(
  new URL("./knowledge-list-item-view-model.ts", import.meta.url),
  "utf8",
);
const appPageSource = readFileSync(
  new URL("../../app/app/page.tsx", import.meta.url),
  "utf8",
);

assert.ok(!viewModelSource.includes("const spaceLabels"));
assert.ok(!viewModelSource.includes("const typeLabels"));
assert.ok(!viewModelSource.includes("const statusLabels"));
assert.match(
  appPageSource,
  /const \[itemsWithCategories, itemsWithTags\] = await Promise\.all\(\[/,
);
assert.match(
  appPageSource,
  /attachCategoriesToKnowledgeItems\(\s*user\.id,\s*items,\s*\)/,
);
assert.match(
  appPageSource,
  /attachTagsToKnowledgeItems\(\s*user\.id,\s*items,\s*\)/,
);

const labelByValue = (options, value) =>
  options.find((option) => option.value === value)?.label;

const item = {
  id: "item-1",
  user_id: "user-1",
  title: "   ",
  content: " 第一行内容 \n\n 第二行内容 ".repeat(8),
  space: "work",
  type: "note",
  status: "inbox",
  source_url: null,
  is_favorite: true,
  category_id: null,
  category: null,
  created_at: "2026-04-26T00:00:00.000Z",
  updated_at: "2026-04-27T02:30:00.000Z",
};

const viewModel = buildKnowledgeListItemViewModel(item);

assert.equal(viewModel.title, DEFAULT_KNOWLEDGE_ITEM_TITLE);
assert.equal(viewModel.spaceLabel, labelByValue(KNOWLEDGE_SPACES, item.space));
assert.equal(viewModel.typeLabel, labelByValue(KNOWLEDGE_TYPES, item.type));
assert.equal(
  viewModel.statusLabel,
  labelByValue(KNOWLEDGE_STATUSES, item.status),
);
assert.equal(viewModel.favoriteLabel, "已收藏");
assert.equal(viewModel.categoryLabel, "未分类");
assert.deepEqual(viewModel.tagNames, []);
assert.equal(viewModel.updatedAtLabel, "2026-04-27");
assert.ok(viewModel.summary.startsWith("第一行内容 第二行内容"));
assert.ok(viewModel.summary.length <= 123);

const emptyContentViewModel = buildKnowledgeListItemViewModel({
  ...item,
  title: "有标题",
  content: "   ",
  is_favorite: false,
});

assert.equal(emptyContentViewModel.title, "有标题");
assert.equal(emptyContentViewModel.summary, "暂无正文内容");
assert.equal(emptyContentViewModel.favoriteLabel, "未收藏");

const summaryViewModel = buildKnowledgeListItemViewModel({
  ...item,
  summary: "AI 摘要内容",
});

assert.equal(summaryViewModel.summary, "AI 摘要内容");

const trimmedSummaryViewModel = buildKnowledgeListItemViewModel({
  ...item,
  summary: "  AI 摘要内容  ",
});

assert.equal(trimmedSummaryViewModel.summary, "AI 摘要内容");

const blankSummaryViewModel = buildKnowledgeListItemViewModel({
  ...item,
  summary: "   ",
  content: " 摘要为空时使用正文片段 ",
});

assert.equal(blankSummaryViewModel.summary, "摘要为空时使用正文片段");

const longSummary = "AI 摘要内容".repeat(30);
const longSummaryViewModel = buildKnowledgeListItemViewModel({
  ...item,
  summary: longSummary,
});

assert.equal(longSummaryViewModel.summary, longSummary);

const taggedViewModel = buildKnowledgeListItemViewModel({
  ...item,
  category: {
    id: "category-1",
    user_id: "user-1",
    name: "项目",
    created_at: "2026-04-26T00:00:00.000Z",
    updated_at: "2026-04-26T00:00:00.000Z",
  },
  tags: [
    {
      id: "tag-1",
      user_id: "user-1",
      name: "work",
      created_at: "2026-04-26T00:00:00.000Z",
      updated_at: "2026-04-26T00:00:00.000Z",
    },
    {
      id: "tag-2",
      user_id: "user-1",
      name: "life",
      created_at: "2026-04-26T00:00:00.000Z",
      updated_at: "2026-04-26T00:00:00.000Z",
    },
  ],
});

assert.deepEqual(taggedViewModel.tagNames, ["work", "life"]);
assert.equal(taggedViewModel.categoryLabel, "项目");
