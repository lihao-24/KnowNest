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
const editorSource = readFileSync(
  new URL("../../app/app/items/[id]/knowledge-item-editor.tsx", import.meta.url),
  "utf8",
);
const newFormSource = readFileSync(
  new URL("../../app/app/items/new/knowledge-form.tsx", import.meta.url),
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
assert.doesNotMatch(assistantPanelSource, /\bbaseUrl\s*:/);
assert.doesNotMatch(assistantPanelSource, /\bapiKey\s*:/);
assert.doesNotMatch(assistantPanelSource, /\bapiKeyEnv\s*:/);
assert.doesNotMatch(assistantPanelSource, /\bmodel\s*:/);

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
