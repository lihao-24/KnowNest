import type { AIAction, AIGenerateResult, AIErrorCode } from "../../types/ai";

export function parseAIJson(content: string): unknown {
  const trimmed = content.trim();

  if (!trimmed) {
    throw createAIRequestError(
      "empty_provider_response",
      502,
      "AI 返回内容为空。",
    );
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    throw createAIRequestError(
      "invalid_provider_response",
      502,
      "AI 返回内容格式异常。",
    );
  }
}

export function validateAIResult(
  action: AIAction,
  value: unknown,
): AIGenerateResult {
  if (!isRecord(value)) {
    throwInvalidProviderResponse();
  }

  switch (action) {
    case "generate_summary":
      return { summary: readRequiredString(value.summary) };
    case "suggest_tags":
      return { tags: readTags(value.tags) };
    case "suggest_category":
      return {
        category: readRequiredString(value.category),
        reason: readRequiredString(value.reason),
      };
    case "improve_title": {
      const title = readRequiredString(value.title);

      if (title.length > 30) {
        throwInvalidProviderResponse();
      }

      return { title };
    }
    case "organize_content":
      return { content: readRequiredString(value.content) };
    default:
      throw createAIRequestError(
        "invalid_action",
        400,
        "Unsupported AI action.",
      );
  }
}

function readRequiredString(value: unknown): string {
  if (typeof value !== "string") {
    throwInvalidProviderResponse();
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throwInvalidProviderResponse();
  }

  return trimmed;
}

function readTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throwInvalidProviderResponse();
  }

  const tags = Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  if (tags.length < 3 || tags.length > 5) {
    throwInvalidProviderResponse();
  }

  return tags;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function throwInvalidProviderResponse(): never {
  throw createAIRequestError(
    "invalid_provider_response",
    502,
    "AI 返回内容格式异常。",
  );
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
