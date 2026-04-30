import type { PublicAIModelOption } from "./config";

export const AI_MODEL_SELECTION_STORAGE_KEY = "knownest.ai.modelId";

export function getStoredAIModelId(): string | null {
  const storage = getLocalStorage();

  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(AI_MODEL_SELECTION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAIModelId(modelId: string): void {
  const trimmedModelId = modelId.trim();

  if (!trimmedModelId) {
    return;
  }

  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(AI_MODEL_SELECTION_STORAGE_KEY, trimmedModelId);
  } catch {
    // Ignore unavailable or denied browser storage.
  }
}

export function clearStoredAIModelId(): void {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(AI_MODEL_SELECTION_STORAGE_KEY);
  } catch {
    // Ignore unavailable or denied browser storage.
  }
}

export function resolveSelectedAIModelId(
  options: PublicAIModelOption[],
  defaultModelId: string,
  storedModelId: string | null | undefined,
): string {
  const storedId = storedModelId?.trim();
  const defaultId = defaultModelId.trim();

  if (storedId && hasModelOption(options, storedId)) {
    return storedId;
  }

  if (defaultId && hasModelOption(options, defaultId)) {
    return defaultId;
  }

  return options[0]?.id ?? "";
}

function getLocalStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function hasModelOption(
  options: PublicAIModelOption[],
  modelId: string,
): boolean {
  return options.some((option) => option.id === modelId);
}
