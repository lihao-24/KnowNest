"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { getStoredAIModelId } from "@/lib/ai/client-model-selection";
import type { AIAction } from "@/types/ai";
import type { Category } from "@/types/knowledge";

import {
  getGenerateSummaryStartedFeedback,
} from "./ai-assistant-panel-model";
import { AIResultPreview } from "./ai-result-preview";
import { AITagSuggestions } from "./ai-tag-suggestions";

type ApplySummaryActionResult = {
  errorMessage: string;
  successMessage: string;
};

type ApplyAIActionResult = {
  errorMessage: string;
  successMessage: string;
};

type AIAssistantPanelProps = {
  categories?: Category[];
  content?: string;
  currentTagNames?: string[];
  knowledgeItemId?: string;
  onAppendContent?: (content: string) => void;
  onApplyCategory?: (categoryId: string) => void | Promise<ApplyAIActionResult>;
  onApplySummary?: (summary: string) => Promise<ApplySummaryActionResult>;
  onApplyTags?: (tags: string[]) => void | Promise<ApplyAIActionResult>;
  onApplyTitle?: (title: string) => void;
  onReplaceContent?: (content: string) => void;
  title?: string;
};

type PreviewAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type AIActionResponse =
  | {
      ok: true;
      result?: Record<string, unknown>;
    }
  | {
      ok: false;
      error?: {
        message?: string;
      };
    };

type AIActionResult =
  | {
      ok: true;
      action: "generate_summary";
      summary: string;
    }
  | {
      ok: true;
      action: "suggest_tags";
      tags: string[];
    }
  | {
      ok: true;
      action: "suggest_category";
      category: string;
      reason: string;
    }
  | {
      ok: true;
      action: "improve_title";
      title: string;
    }
  | {
      ok: true;
      action: "organize_content";
      content: string;
    }
  | {
      ok: false;
      errorMessage: string;
    };

export function AIAssistantPanel({
  categories = [],
  content = "",
  currentTagNames = [],
  knowledgeItemId,
  onAppendContent,
  onApplyCategory,
  onApplySummary,
  onApplyTags,
  onApplyTitle,
  onReplaceContent,
  title = "",
}: AIAssistantPanelProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<AIActionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, startApplyTransition] = useTransition();
  const isBusy = isGenerating || isApplying;
  const actionButtons = buildActionButtons({
    hasCategoryApply: Boolean(onApplyCategory),
    hasContentApply: Boolean(onAppendContent || onReplaceContent),
    hasTagsApply: Boolean(onApplyTags),
    hasTitleApply: Boolean(onApplyTitle),
  });

  async function handleGenerate(action: AIAction) {
    const startedFeedback = getGenerateSummaryStartedFeedback();

    if (!knowledgeItemId && !content.trim()) {
      setPreview(null);
      setErrorMessage("请先输入正文内容。");
      setSuccessMessage("");
      return;
    }

    setIsGenerating(true);
    setActiveAction(action);
    setPreview(null);
    setErrorMessage(startedFeedback.errorMessage);
    setSuccessMessage(startedFeedback.successMessage);

    try {
      const modelId = getStoredAIModelId();
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          ...(knowledgeItemId ? { knowledgeItemId } : {}),
          title,
          content,
          ...(modelId ? { modelId } : {}),
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | AIActionResponse
        | null;

      const result = buildAIActionResult(action, response.ok, data);

      if (!result.ok) {
        setErrorMessage(result.errorMessage);
        return;
      }

      setPreview(result);
    } catch {
      setErrorMessage("AI 生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  }

  function handleApplySummary() {
    if (!preview?.ok || preview.action !== "generate_summary") {
      return;
    }

    const summary = preview.summary.trim();

    if (!summary) {
      setErrorMessage("摘要不能为空。");
      return;
    }

    if (!onApplySummary) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    startApplyTransition(async () => {
      let result: ApplySummaryActionResult;

      try {
        result = await onApplySummary(summary);
      } catch {
        setErrorMessage("应用摘要失败，请稍后重试。");
        return;
      }

      if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
        return;
      }

      setPreview(null);
      setSuccessMessage(result.successMessage);
      router.refresh();
    });
  }

  function handleApplyTags(tags: string[]) {
    setErrorMessage("");
    setSuccessMessage("");
    startApplyTransition(async () => {
      const result = await runApplyCallback(
        () => onApplyTags?.(tags),
        "已应用标签建议。",
        "应用标签失败，请稍后重试。",
      );

      if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
        return;
      }

      setPreview(null);
      setSuccessMessage(result.successMessage);

      if (result.shouldRefresh) {
        router.refresh();
      }
    });
  }

  function handleApplyCategory(categoryName: string) {
    const matchedCategory = findCategoryByName(categories, categoryName);

    if (!matchedCategory) {
      setErrorMessage("未找到匹配分类，暂不能应用。");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    startApplyTransition(async () => {
      const result = await runApplyCallback(
        () => onApplyCategory?.(matchedCategory.id),
        "已应用分类建议。",
        "应用分类失败，请稍后重试。",
      );

      if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
        return;
      }

      setPreview(null);
      setSuccessMessage(result.successMessage);

      if (result.shouldRefresh) {
        router.refresh();
      }
    });
  }

  function handleApplyTitle(nextTitle: string) {
    onApplyTitle?.(nextTitle);
    setPreview(null);
    setErrorMessage("");
    setSuccessMessage("已应用标题建议。");
  }

  function handleAppendContent(nextContent: string) {
    onAppendContent?.(nextContent);
    setPreview(null);
    setErrorMessage("");
    setSuccessMessage("已追加整理后的正文。");
  }

  function handleReplaceContent(nextContent: string) {
    onReplaceContent?.(nextContent);
    setPreview(null);
    setErrorMessage("");
    setSuccessMessage("已替换为整理后的正文。");
  }

  function handleCancelPreview() {
    setPreview(null);
    setErrorMessage("");
  }

  const previewActions = preview?.ok
    ? buildPreviewActions(preview, {
        categories,
        currentTagNames,
        isApplying,
        onAppendContent: handleAppendContent,
        onApplyCategory: handleApplyCategory,
        onApplySummary: onApplySummary ? handleApplySummary : undefined,
        onApplyTags: onApplyTags ? handleApplyTags : undefined,
        onApplyTitle: onApplyTitle ? handleApplyTitle : undefined,
        onReplaceContent: handleReplaceContent,
      })
    : [];

  return (
    <section className="mb-5 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">AI 助手</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            AI 结果会先生成预览，确认后再应用到当前编辑内容。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {actionButtons.map((button) => (
            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-teal-300 bg-white px-4 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:h-10 sm:w-auto"
              disabled={isBusy}
              key={button.action}
              onClick={() => handleGenerate(button.action)}
              type="button"
            >
              {isGenerating && activeAction === button.action
                ? "生成中..."
                : button.label}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && !preview ? (
        <p
          aria-live="polite"
          className="mt-3 text-sm leading-6 text-red-600"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p
          aria-live="polite"
          className="mt-3 text-sm leading-6 text-teal-700"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      {preview?.ok ? (
        <div className="mt-4">
          <AIResultPreview
            actions={previewActions}
            errorMessage={errorMessage}
            isApplying={isApplying}
            onCancel={handleCancelPreview}
            title={getPreviewTitle(preview)}
          >
            {renderPreviewContent(preview, {
              categories,
              currentTagNames,
              hasSummaryApply: Boolean(onApplySummary),
              isApplying,
              onApplyTags: handleApplyTags,
            })}
          </AIResultPreview>
        </div>
      ) : null}
    </section>
  );
}

function buildActionButtons({
  hasCategoryApply,
  hasContentApply,
  hasTagsApply,
  hasTitleApply,
}: {
  hasCategoryApply: boolean;
  hasContentApply: boolean;
  hasTagsApply: boolean;
  hasTitleApply: boolean;
}): Array<{ action: AIAction; label: string }> {
  return [
    { action: "generate_summary", label: "生成摘要" },
    ...(hasTagsApply
      ? [{ action: "suggest_tags" as const, label: "推荐标签" }]
      : []),
    ...(hasCategoryApply
      ? [{ action: "suggest_category" as const, label: "推荐分类" }]
      : []),
    ...(hasTitleApply
      ? [{ action: "improve_title" as const, label: "优化标题" }]
      : []),
    ...(hasContentApply
      ? [{ action: "organize_content" as const, label: "整理正文" }]
      : []),
  ];
}

async function runApplyCallback(
  callback: () => void | ApplyAIActionResult | Promise<void | ApplyAIActionResult>,
  successMessage: string,
  fallbackErrorMessage: string,
) {
  try {
    const result = await callback();

    if (result && result.errorMessage) {
      return {
        errorMessage: result.errorMessage,
        successMessage: "",
        shouldRefresh: false,
      };
    }

    return {
      errorMessage: "",
      successMessage: result?.successMessage || successMessage,
      shouldRefresh: Boolean(result),
    };
  } catch {
    return {
      errorMessage: fallbackErrorMessage,
      successMessage: "",
      shouldRefresh: false,
    };
  }
}

function buildAIActionResult(
  action: AIAction,
  responseOk: boolean,
  data: AIActionResponse | null,
): AIActionResult {
  if (!responseOk || !data?.ok) {
    return {
      ok: false,
      errorMessage: getAIActionErrorMessage(data),
    };
  }

  const result = data.result;

  if (!result) {
    return {
      ok: false,
      errorMessage: "AI 生成失败，请稍后重试。",
    };
  }

  switch (action) {
    case "generate_summary": {
      const summary = readRequiredString(result.summary);

      return summary
        ? { ok: true, action, summary }
        : { ok: false, errorMessage: "AI 摘要生成失败，请稍后重试。" };
    }
    case "suggest_tags": {
      const tags = readTags(result.tags);

      return tags.length > 0
        ? { ok: true, action, tags }
        : { ok: false, errorMessage: "AI 生成失败，请稍后重试。" };
    }
    case "suggest_category": {
      const category = readRequiredString(result.category);
      const reason = readRequiredString(result.reason);

      return category && reason
        ? { ok: true, action, category, reason }
        : { ok: false, errorMessage: "AI 生成失败，请稍后重试。" };
    }
    case "improve_title": {
      const title = readRequiredString(result.title);

      return title
        ? { ok: true, action, title }
        : { ok: false, errorMessage: "AI 生成失败，请稍后重试。" };
    }
    case "organize_content": {
      const content = readRequiredString(result.content);

      return content
        ? { ok: true, action, content }
        : { ok: false, errorMessage: "AI 生成失败，请稍后重试。" };
    }
  }
}

function getAIActionErrorMessage(data: AIActionResponse | null) {
  if (!data || data.ok) {
    return "AI 生成失败，请稍后重试。";
  }

  return data.error?.message ?? "AI 生成失败，请稍后重试。";
}

function readRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function readTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPreviewActions(
  preview: Exclude<AIActionResult, { ok: false }>,
  handlers: {
    categories: Category[];
    currentTagNames: string[];
    isApplying: boolean;
    onAppendContent: (content: string) => void;
    onApplyCategory: (category: string) => void;
    onApplySummary?: () => void;
    onApplyTags?: (tags: string[]) => void;
    onApplyTitle?: (title: string) => void;
    onReplaceContent: (content: string) => void;
  },
): PreviewAction[] {
  switch (preview.action) {
    case "generate_summary":
      return handlers.onApplySummary
        ? [
            {
              label: handlers.isApplying ? "应用中..." : "应用摘要",
              onClick: handlers.onApplySummary,
            },
          ]
        : [];
    case "suggest_tags":
      return [];
    case "suggest_category":
      return [
        {
          label: "应用分类",
          onClick: () => handlers.onApplyCategory(preview.category),
          disabled: !findCategoryByName(handlers.categories, preview.category),
        },
      ];
    case "improve_title":
      return handlers.onApplyTitle
        ? [
            {
              label: "应用标题",
              onClick: () => handlers.onApplyTitle?.(preview.title),
            },
          ]
        : [];
    case "organize_content":
      return [
        {
          label: "追加到正文",
          onClick: () => handlers.onAppendContent(preview.content),
        },
        {
          label: "替换正文",
          onClick: () => handlers.onReplaceContent(preview.content),
        },
      ];
  }
}

function getPreviewTitle(preview: Exclude<AIActionResult, { ok: false }>) {
  switch (preview.action) {
    case "generate_summary":
      return "摘要预览";
    case "suggest_tags":
      return "标签建议";
    case "suggest_category":
      return "分类建议";
    case "improve_title":
      return "标题建议";
    case "organize_content":
      return "正文整理预览";
  }
}

function renderPreviewContent(
  preview: Exclude<AIActionResult, { ok: false }>,
  options: {
    categories: Category[];
    currentTagNames: string[];
    hasSummaryApply: boolean;
    isApplying: boolean;
    onApplyTags: (tags: string[]) => void;
  },
) {
  switch (preview.action) {
    case "generate_summary":
      return (
        <>
          <p>{preview.summary}</p>
          {!options.hasSummaryApply ? (
            <p className="mt-2 text-slate-500">
              当前页面仅预览摘要，不会写入表单。
            </p>
          ) : null}
        </>
      );
    case "suggest_tags":
      return (
        <AITagSuggestions
          disabled={options.isApplying}
          onApply={options.onApplyTags}
          tags={preview.tags}
        />
      );
    case "suggest_category": {
      const matchedCategory = findCategoryByName(
        options.categories,
        preview.category,
      );

      return (
        <>
          <p>推荐分类：{preview.category}</p>
          <p className="mt-2 text-slate-500">推荐原因：{preview.reason}</p>
          {!matchedCategory ? (
            <p className="mt-2 text-red-600">未找到同名分类，暂不能应用。</p>
          ) : null}
        </>
      );
    }
    case "improve_title":
      return <p>{preview.title}</p>;
    case "organize_content":
      return <p>{preview.content}</p>;
  }
}

function findCategoryByName(categories: Category[], categoryName: string) {
  return categories.find((category) => category.name === categoryName) ?? null;
}
