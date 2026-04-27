import assert from "node:assert/strict";

import {
  buildKnowledgeListItemViewModel,
  DEFAULT_KNOWLEDGE_ITEM_TITLE,
} from "./knowledge-list-item-view-model.ts";

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
  created_at: "2026-04-26T00:00:00.000Z",
  updated_at: "2026-04-27T02:30:00.000Z",
};

const viewModel = buildKnowledgeListItemViewModel(item);

assert.equal(viewModel.title, DEFAULT_KNOWLEDGE_ITEM_TITLE);
assert.equal(viewModel.spaceLabel, "工作");
assert.equal(viewModel.typeLabel, "笔记");
assert.equal(viewModel.favoriteLabel, "已收藏");
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
