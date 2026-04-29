import type { AIErrorCode } from "../../types/ai";

export function assertAIUsageAllowed(
  currentCount: number,
  dailyLimit: number,
): void {
  if (currentCount >= dailyLimit) {
    throw createAIRequestError(
      "daily_limit_exceeded",
      429,
      "今日 AI 使用次数已达上限，请明天再试。",
    );
  }
}

export function validateAIInputLength(
  content: string,
  min: number,
  max: number,
): void {
  const trimmed = content.trim();

  if (!trimmed) {
    throw createAIRequestError("content_empty", 400, "请先输入正文内容。");
  }

  if (trimmed.length < min) {
    throw createAIRequestError("content_too_short", 400, "内容过短，无法生成。");
  }

  if (trimmed.length > max) {
    throw createAIRequestError(
      "content_too_long",
      400,
      "内容过长，请缩短后重试。",
    );
  }
}

function createAIRequestError(
  code: AIErrorCode,
  status: number,
  message: string,
): Error & { code: AIErrorCode; status: number } {
  const error = new Error(message) as Error & {
    code: AIErrorCode;
    status: number;
  };
  error.name = "AIRequestError";
  error.code = code;
  error.status = status;

  return error;
}
