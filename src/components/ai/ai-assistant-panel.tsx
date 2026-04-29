"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AIResultPreview } from "./ai-result-preview";

type ApplySummaryActionResult = {
  errorMessage: string;
  successMessage: string;
};

type AIAssistantPanelProps = {
  knowledgeItemId: string;
  onApplySummary: (summary: string) => Promise<ApplySummaryActionResult>;
};

type GenerateSummaryResponse =
  | {
      ok: true;
      result: {
        summary: string;
      };
    }
  | {
      ok: false;
      error?: {
        message?: string;
      };
    };

export function AIAssistantPanel({
  knowledgeItemId,
  onApplySummary,
}: AIAssistantPanelProps) {
  const router = useRouter();
  const [summaryPreview, setSummaryPreview] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, startApplyTransition] = useTransition();

  async function handleGenerateSummary() {
    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate_summary",
          knowledgeItemId,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | GenerateSummaryResponse
        | null;

      if (!response.ok || !data?.ok) {
        setErrorMessage(getGenerateSummaryErrorMessage(data));
        return;
      }

      setSummaryPreview(data.result.summary);
    } catch {
      setErrorMessage("AI 摘要生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleApplySummary() {
    const summary = summaryPreview.trim();

    if (!summary) {
      setErrorMessage("摘要不能为空。");
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

      setSummaryPreview("");
      setSuccessMessage(result.successMessage);
      router.refresh();
    });
  }

  function handleCancelPreview() {
    setSummaryPreview("");
    setErrorMessage("");
  }

  return (
    <section className="mb-5 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">AI 助手</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            生成摘要后可预览，确认后再应用到这条知识。
          </p>
        </div>
        <button
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-teal-300 bg-white px-4 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:h-10 sm:w-auto"
          disabled={isGenerating || isApplying}
          onClick={handleGenerateSummary}
          type="button"
        >
          {isGenerating ? "生成中..." : "生成摘要"}
        </button>
      </div>

      {errorMessage && !summaryPreview ? (
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

      {summaryPreview ? (
        <div className="mt-4">
          <AIResultPreview
            errorMessage={errorMessage}
            isApplying={isApplying}
            onApply={handleApplySummary}
            onCancel={handleCancelPreview}
            summary={summaryPreview}
          />
        </div>
      ) : null}
    </section>
  );
}

function getGenerateSummaryErrorMessage(data: GenerateSummaryResponse | null) {
  if (!data || data.ok) {
    return "AI 摘要生成失败，请稍后重试。";
  }

  return data.error?.message ?? "AI 摘要生成失败，请稍后重试。";
}
