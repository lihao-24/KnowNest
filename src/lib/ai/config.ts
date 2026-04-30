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

export type AIModelProvider = "openai-compatible";

export type AIModelOption = {
  id: string;
  label: string;
  provider: AIModelProvider;
  baseUrl?: string;
  baseUrlEnv?: string;
  apiKeyEnv: string;
  model: string;
};

export type PublicAIModelOption = {
  id: string;
  label: string;
  provider: AIModelProvider;
  model: string;
};

export type AIModelRegistry = {
  defaultModelId: string;
  options: AIModelOption[];
};

export type ResolvedAIModelConfig = {
  id: string;
  label: string;
  provider: AIModelProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
};

type AIEnv = Record<string, string | undefined>;

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_FAST_MODEL = "deepseek-v4-flash";
const DEFAULT_DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_QUALITY_MODEL = "deepseek-v4-pro";
const DEFAULT_MODEL_ID = "deepseek-default";
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

export function readAIModelRegistry(env: AIEnv = process.env): AIModelRegistry {
  const parsedOptions = readAIModelOptions(env);
  const options =
    parsedOptions.length > 0 ? parsedOptions : [buildDefaultDeepSeekOption(env)];
  const requestedDefaultId = readString(env.AI_DEFAULT_MODEL_ID, DEFAULT_MODEL_ID);
  const defaultModelId = options.some((option) => option.id === requestedDefaultId)
    ? requestedDefaultId
    : options[0].id;

  return {
    defaultModelId,
    options,
  };
}

export function getPublicAIModelOptions(
  registry: AIModelRegistry,
): PublicAIModelOption[] {
  return registry.options.map((option) => ({
    id: option.id,
    label: option.label,
    provider: option.provider,
    model: option.model,
  }));
}

export function resolveAIModelConfig(
  modelId: string | null | undefined,
  registry: AIModelRegistry,
  env: AIEnv = process.env,
): ResolvedAIModelConfig {
  const requestedModelId = modelId?.trim();
  const selectedOption =
    registry.options.find((option) => option.id === requestedModelId) ??
    registry.options.find((option) => option.id === registry.defaultModelId) ??
    registry.options[0];

  if (!selectedOption) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model options are not configured.",
    );
  }

  const apiKey = readString(env[selectedOption.apiKeyEnv], "");
  const baseUrl = selectedOption.baseUrlEnv
    ? readString(env[selectedOption.baseUrlEnv], "")
    : readString(selectedOption.baseUrl, "");

  if (!apiKey || !baseUrl) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model provider is not configured.",
    );
  }

  return {
    id: selectedOption.id,
    label: selectedOption.label,
    provider: selectedOption.provider,
    apiKey,
    baseUrl,
    model: selectedOption.model,
  };
}

function readAIModelOptions(env: AIEnv): AIModelOption[] {
  const rawOptions = readString(env.AI_MODEL_OPTIONS, "");

  if (!rawOptions) {
    return [];
  }

  let value: unknown;

  try {
    value = JSON.parse(rawOptions);
  } catch {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model options are not valid JSON.",
    );
  }

  if (!Array.isArray(value)) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model options must be an array.",
    );
  }

  const options = value.map(parseAIModelOption);
  const uniqueIds = new Set<string>();

  for (const option of options) {
    if (uniqueIds.has(option.id)) {
      throw createAIRequestError(
        "provider_not_configured",
        500,
        "AI model option IDs must be unique.",
      );
    }

    uniqueIds.add(option.id);
  }

  return options;
}

function parseAIModelOption(value: unknown): AIModelOption {
  if (!isRecord(value)) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model option is invalid.",
    );
  }

  const id = readStringValue(value.id);
  const label = readStringValue(value.label);
  const provider = readStringValue(value.provider);
  const baseUrl = readStringValue(value.baseUrl);
  const baseUrlEnv = readStringValue(value.baseUrlEnv);
  const apiKeyEnv = readStringValue(value.apiKeyEnv);
  const model = readStringValue(value.model);

  if (
    !id ||
    !label ||
    provider !== "openai-compatible" ||
    (!baseUrl && !baseUrlEnv) ||
    !apiKeyEnv ||
    !model
  ) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model option is invalid.",
    );
  }

  return {
    id,
    label,
    provider,
    ...(baseUrl ? { baseUrl } : {}),
    ...(baseUrlEnv ? { baseUrlEnv } : {}),
    apiKeyEnv,
    model,
  };
}

function buildDefaultDeepSeekOption(env: AIEnv): AIModelOption {
  return {
    id: DEFAULT_MODEL_ID,
    label: "DeepSeek 默认",
    provider: "openai-compatible",
    baseUrl: readString(env.DEEPSEEK_BASE_URL, DEFAULT_BASE_URL),
    apiKeyEnv: "DEEPSEEK_API_KEY",
    model: readString(env.AI_MODEL_DEFAULT, DEFAULT_DEFAULT_MODEL),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function readStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
