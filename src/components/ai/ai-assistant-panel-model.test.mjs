import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code === "ERR_MODULE_NOT_FOUND" &&
        specifier.startsWith("./") &&
        !specifier.endsWith(".ts")
      ) {
        return nextResolve(`${specifier}.ts`, context);
      }

      throw error;
    }
  },
});

const {
  GENERATE_SUMMARY_FAILED_MESSAGE,
  buildGenerateSummaryResult,
  getGenerateSummaryStartedFeedback,
} = await import("./ai-assistant-panel-model.ts");

const assistantPanelSource = readFileSync(
  new URL("./ai-assistant-panel.tsx", import.meta.url),
  "utf8",
);
const tagSuggestionsSource = readFileSync(
  new URL("./ai-tag-suggestions.tsx", import.meta.url),
  "utf8",
);
const editorSource = readFileSync(
  new URL("../../app/app/items/[id]/knowledge-item-editor.tsx", import.meta.url),
  "utf8",
);
const newFormSource = readFileSync(
  new URL("../../app/app/items/new/knowledge-form.tsx", import.meta.url),
  "utf8",
);
const detailPageSource = readFileSync(
  new URL("../../app/app/items/[id]/page.tsx", import.meta.url),
  "utf8",
);
const detailActionsSource = readFileSync(
  new URL("../../app/app/items/[id]/actions.ts", import.meta.url),
  "utf8",
);

assert.match(
  assistantPanelSource,
  /import \{ getStoredAIModelId \} from "@\/lib\/ai\/client-model-selection";/,
);
assert.match(assistantPanelSource, /const modelId = getStoredAIModelId\(\);/);
assert.match(
  assistantPanelSource,
  /\.\.\.\(modelId \? \{ modelId \} : \{\}\),/,
);
assert.match(
  assistantPanelSource,
  /\.\.\.\(knowledgeItemId \? \{ knowledgeItemId \} : \{\}\),/,
);
assert.match(assistantPanelSource, /\btitle,\s*\n\s*content,/);
assert.match(assistantPanelSource, /action: "suggest_tags"/);
assert.match(assistantPanelSource, /action: "suggest_category"/);
assert.match(assistantPanelSource, /action: "improve_title"/);
assert.match(assistantPanelSource, /action: "organize_content"/);
assert.match(
  assistantPanelSource,
  /import \{ AITagSuggestions \} from "\.\/ai-tag-suggestions";/,
);
assert.match(assistantPanelSource, /<AITagSuggestions/);
assert.match(assistantPanelSource, /确认替换正文/);
assert.doesNotMatch(assistantPanelSource, /\bbaseUrl\s*:/);
assert.doesNotMatch(assistantPanelSource, /\bapiKey\s*:/);
assert.doesNotMatch(assistantPanelSource, /\bapiKeyEnv\s*:/);
assert.doesNotMatch(assistantPanelSource, /\bmodel\s*:/);

assert.match(tagSuggestionsSource, /useState\(\(\) => tags\)/);
assert.match(tagSuggestionsSource, /useEffect\(\(\) => \{\s*setSelectedTags\(tags\);/);
assert.match(tagSuggestionsSource, /type="checkbox"/);
assert.match(tagSuggestionsSource, /添加到知识/);

assert.match(editorSource, /<AIAssistantPanel/);
assert.match(editorSource, /value=\{title\}/);
assert.match(editorSource, /onChange=\{\(event\) => setTitle\(event\.target\.value\)\}/);
assert.match(editorSource, /value=\{categoryId\}/);
assert.match(
  editorSource,
  /onChange=\{\(event\) => setCategoryId\(event\.target\.value\)\}/,
);
assert.match(editorSource, /knowledgeItemId=\{item\.id\}/);
assert.doesNotMatch(editorSource, /onApplySummary=/);

assert.match(newFormSource, /<AIAssistantPanel/);
assert.match(newFormSource, /value=\{title\}/);
assert.match(newFormSource, /value=\{categoryId\}/);
assert.doesNotMatch(newFormSource, /knowledgeItemId=/);
assert.doesNotMatch(newFormSource, /onApplySummary=/);

assert.match(detailPageSource, /listCategories\(user\.id\)/);
assert.match(detailPageSource, /applyKnowledgeItemTagsAction\.bind\(null, item\.id\)/);
assert.match(
  detailPageSource,
  /applyKnowledgeItemCategoryAction\.bind\(null, item\.id\)/,
);
assert.match(detailPageSource, /categories=\{categories\}/);
assert.match(detailPageSource, /currentTagNames=\{tags\.map\(\(tag\) => tag\.name\)\}/);
assert.match(detailPageSource, /onApplyTags=\{applyTags\}/);
assert.match(detailPageSource, /onApplyCategory=\{applyCategory\}/);
assert.match(detailPageSource, /applyKnowledgeItemTitleAction\.bind\(null, item\.id\)/);
assert.match(
  detailPageSource,
  /appendKnowledgeItemOrganizedContentAction\.bind\(null, item\.id\)/,
);
assert.match(
  detailPageSource,
  /replaceKnowledgeItemContentAction\.bind\(null, item\.id\)/,
);
assert.match(detailPageSource, /onApplyTitle=\{applyTitle\}/);
assert.match(detailPageSource, /onAppendContent=\{appendOrganizedContent\}/);
assert.match(detailPageSource, /onReplaceContent=\{replaceContent\}/);

assert.match(detailActionsSource, /export async function applyKnowledgeItemTagsAction/);
assert.match(
  detailActionsSource,
  /export async function applyKnowledgeItemCategoryAction/,
);
assert.match(detailActionsSource, /export async function applyKnowledgeItemTitleAction/);
assert.match(
  detailActionsSource,
  /export async function appendKnowledgeItemOrganizedContentAction/,
);
assert.match(
  detailActionsSource,
  /export async function replaceKnowledgeItemContentAction/,
);
assert.match(detailActionsSource, /listTagsByItemId/);
assert.match(detailActionsSource, /getCategoryById/);
assert.match(detailActionsSource, /## AI 整理结果/);

assert.deepEqual(getGenerateSummaryStartedFeedback(), {
  summaryPreview: "",
  errorMessage: "",
  successMessage: "",
});

assert.deepEqual(
  buildGenerateSummaryResult(true, {
    ok: true,
    result: {
      summary: "AI 摘要内容",
    },
  }),
  {
    ok: true,
    summary: "AI 摘要内容",
  },
);

assert.deepEqual(
  buildGenerateSummaryResult(false, {
    ok: false,
    error: {
      message: "今日 AI 使用次数已达上限。",
    },
  }),
  {
    ok: false,
    errorMessage: "今日 AI 使用次数已达上限。",
  },
);

assert.deepEqual(
  buildGenerateSummaryResult(true, {
    ok: true,
    result: {
      summary: "   ",
    },
  }),
  {
    ok: false,
    errorMessage: GENERATE_SUMMARY_FAILED_MESSAGE,
  },
);

assert.deepEqual(
  buildGenerateSummaryResult(true, {
    ok: true,
    result: {},
  }),
  {
    ok: false,
    errorMessage: GENERATE_SUMMARY_FAILED_MESSAGE,
  },
);
