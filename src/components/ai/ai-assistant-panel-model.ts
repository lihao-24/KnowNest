export const GENERATE_SUMMARY_FAILED_MESSAGE =
  "AI 摘要生成失败，请稍后重试。";

export type GenerateSummaryResponse =
  | {
      ok: true;
      result?: {
        summary?: unknown;
      };
    }
  | {
      ok: false;
      error?: {
        message?: string;
      };
    };

export type GenerateSummaryResult =
  | {
      ok: true;
      summary: string;
    }
  | {
      ok: false;
      errorMessage: string;
    };

export function getGenerateSummaryStartedFeedback() {
  return {
    summaryPreview: "",
    errorMessage: "",
    successMessage: "",
  };
}

export function buildGenerateSummaryResult(
  responseOk: boolean,
  data: GenerateSummaryResponse | null,
): GenerateSummaryResult {
  if (!responseOk || !data?.ok) {
    return {
      ok: false,
      errorMessage: getGenerateSummaryErrorMessage(data),
    };
  }

  const summary = data.result?.summary;

  if (typeof summary !== "string" || !summary.trim()) {
    return {
      ok: false,
      errorMessage: GENERATE_SUMMARY_FAILED_MESSAGE,
    };
  }

  return {
    ok: true,
    summary,
  };
}

function getGenerateSummaryErrorMessage(data: GenerateSummaryResponse | null) {
  if (!data || data.ok) {
    return GENERATE_SUMMARY_FAILED_MESSAGE;
  }

  return data.error?.message ?? GENERATE_SUMMARY_FAILED_MESSAGE;
}
