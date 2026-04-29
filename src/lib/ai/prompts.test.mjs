import assert from "node:assert/strict";

import { buildAIMessages } from "./prompts.ts";

const actions = [
  "generate_summary",
  "suggest_tags",
  "suggest_category",
  "improve_title",
  "organize_content",
];

for (const action of actions) {
  const messages = buildAIMessages({
    action,
    title: "Supabase RLS 笔记",
    content: "记录 Supabase RLS 策略和 Drizzle 查询边界。",
    existingTags: ["Supabase"],
    existingCategories: ["项目"],
    model: "deepseek-v4-flash",
  });

  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, "system");
  assert.equal(messages[1].role, "user");
  assert.match(messages[0].content, /必须返回 JSON/);
  assert.match(messages[0].content, /不要输出 Markdown 代码围栏/);
  assert.match(messages[1].content, /Supabase RLS 笔记/);
  assert.match(messages[1].content, /记录 Supabase RLS 策略/);
}

const tagMessages = buildAIMessages({
  action: "suggest_tags",
  title: "标签测试",
  content: "正文",
  existingTags: ["Supabase", "RLS"],
  existingCategories: [],
  model: "deepseek-v4-flash",
});

assert.match(tagMessages[1].content, /已有标签/);
assert.match(tagMessages[1].content, /Supabase/);
assert.match(tagMessages[1].content, /RLS/);
assert.match(tagMessages[1].content, /3 到 5 个/);

const categoryMessages = buildAIMessages({
  action: "suggest_category",
  title: "分类测试",
  content: "正文",
  existingTags: [],
  existingCategories: ["项目", "生活"],
  model: "deepseek-v4-flash",
});

assert.match(categoryMessages[1].content, /已有分类/);
assert.match(categoryMessages[1].content, /项目/);
assert.match(categoryMessages[1].content, /生活/);
assert.match(categoryMessages[1].content, /reason/);

const organizeMessages = buildAIMessages({
  action: "organize_content",
  title: "正文整理",
  content: "无序内容",
  existingTags: [],
  existingCategories: [],
  model: "deepseek-v4-flash",
});

assert.match(organizeMessages[1].content, /Markdown/);
assert.match(organizeMessages[1].content, /保持原意/);
assert.match(organizeMessages[1].content, /不要编造/);
