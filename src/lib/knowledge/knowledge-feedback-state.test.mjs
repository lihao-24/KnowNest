import assert from "node:assert/strict";

import {
  appKnowledgeListDefaultEmptyState,
  appKnowledgeListFilteredEmptyState,
  detailErrorFeedback,
  detailLoadingFeedback,
  getAppKnowledgeListEmptyState,
  listErrorFeedback,
  listLoadingFeedback,
} from "./knowledge-feedback-state.ts";

assert.equal(getAppKnowledgeListEmptyState(false), undefined);
assert.deepEqual(getAppKnowledgeListEmptyState(true), {
  title: "没有找到匹配内容",
  description: "换个条件再试试，或清除筛选查看默认列表。",
  actionLabel: "新建知识",
});

assert.deepEqual(appKnowledgeListDefaultEmptyState, {
  title: "还没有知识内容",
  description: "先创建第一条知识，开始搭建你的个人知识库。",
  actionLabel: "新建知识",
});

assert.deepEqual(
  appKnowledgeListFilteredEmptyState,
  getAppKnowledgeListEmptyState(true),
);

assert.deepEqual(listLoadingFeedback, {
  title: "正在加载知识内容",
  description: "列表会在数据准备好后自动显示。",
});

assert.deepEqual(detailLoadingFeedback, {
  title: "正在加载知识详情",
  description: "编辑表单会在数据准备好后自动显示。",
});

assert.deepEqual(listErrorFeedback, {
  title: "内容加载失败",
  description: "刷新页面再试一次，或稍后重新打开应用。",
  retryLabel: "重试",
});

assert.deepEqual(detailErrorFeedback, {
  title: "知识详情加载失败",
  description: "刷新页面再试一次，或返回列表后重新打开这条知识。",
  retryLabel: "重试",
});
