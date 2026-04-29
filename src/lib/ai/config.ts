import type { AIAction, AIErrorCode } from "../../types/ai";

export type AIConfig = {
  provider: "deepseek";
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  modelFast: string;
  modelDefault: string;
  modelQuality: string;
  dailyLimit: number;
  maxInputChars: number;
  minInputChars: number;
};

type AIEnv = Record<string, string | undefined>;

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_FAST_MODEL = "deepseek-v4-flash";
const DEFAULT_DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_QUALITY_MODEL = "deepseek-v4-pro";
const DEFAULT_DAILY_LIMIT = 20;
const DEFAULT_MAX_INPUT_CHARS = 8000;
const DEFAULT_MIN_INPUT_CHARS = 20;

export function readAIConfig(env: AIEnv = process.env): AIConfig {
  const provider = readString(env.AI_PROVIDER, "deepseek");

  if (provider !== "deepseek") {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI provider is not configured.",
    );
  }

  const deepseekApiKey = readString(env.DEEPSEEK_API_KEY, "");

  if (!deepseekApiKey) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "DeepSeek API key is not configured.",
    );
  }

  return {
    provider: "deepseek",
    deepseekApiKey,
    deepseekBaseUrl: readString(env.DEEPSEEK_BASE_URL, DEFAULT_BASE_URL),
    modelFast: readString(env.AI_MODEL_FAST, DEFAULT_FAST_MODEL),
    modelDefault: readString(env.AI_MODEL_DEFAULT, DEFAULT_DEFAULT_MODEL),
    modelQuality: readString(env.AI_MODEL_QUALITY, DEFAULT_QUALITY_MODEL),
    dailyLimit: readPositiveInteger(env.AI_DAILY_LIMIT, DEFAULT_DAILY_LIMIT),
    maxInputChars: readPositiveInteger(
      env.AI_MAX_INPUT_CHARS,
      DEFAULT_MAX_INPUT_CHARS,
    ),
    minInputChars: readPositiveInteger(
      env.AI_MIN_INPUT_CHARS,
      DEFAULT_MIN_INPUT_CHARS,
    ),
  };
}

export function getModelForAction(action: AIAction, config: AIConfig): string {
  if (action === "organize_content") {
    return config.modelDefault;
  }

  if (
    action === "generate_summary" ||
    action === "suggest_tags" ||
    action === "suggest_category" ||
    action === "improve_title"
  ) {
    return config.modelFast;
  }

  throw createAIRequestError("invalid_action", 400, "Unsupported AI action.");
}

function readString(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function readPositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
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
