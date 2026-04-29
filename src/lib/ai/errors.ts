import type { AIErrorCode } from "../../types/ai";

const AI_ERROR_CODES = new Set<AIErrorCode>([
  "unauthorized",
  "forbidden",
  "invalid_request",
  "invalid_action",
  "content_empty",
  "content_too_short",
  "content_too_long",
  "daily_limit_exceeded",
  "provider_not_configured",
  "provider_failed",
  "empty_provider_response",
  "invalid_provider_response",
]);

export class AIRequestError extends Error {
  code: AIErrorCode;
  status: number;

  constructor(
    code: AIErrorCode,
    status: number,
    message: string,
  ) {
    super(message);
    this.name = "AIRequestError";
    this.code = code;
    this.status = status;
  }
}

export function toAIErrorResponse(error: unknown): {
  status: number;
  body: { ok: false; error: { code: AIErrorCode; message: string } };
} {
  if (isAIRequestErrorLike(error)) {
    return {
      status: error.status,
      body: {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      ok: false,
      error: {
        code: "provider_failed",
        message: "AI 请求失败，请稍后重试。",
      },
    },
  };
}

function isAIRequestErrorLike(
  error: unknown,
): error is Error & { code: AIErrorCode; status: number } {
  return (
    error instanceof Error &&
    "code" in error &&
    AI_ERROR_CODES.has(error.code as AIErrorCode) &&
    "status" in error &&
    typeof error.status === "number"
  );
}
