import type { ResolvedAIModelConfig } from "./config";
import { createAIRequestError } from "./errors";
import type { AIProvider } from "./provider";

export function createAIProvider(config: ResolvedAIModelConfig): AIProvider {
  if (config.provider === "openai-compatible") {
    let provider: AIProvider | null = null;

    return {
      async generate(params) {
        const mod = await import("./openai-compatible");
        provider ??= mod.createOpenAICompatibleProvider(config);

        return provider.generate(params);
      },
    };
  }

  throw createAIRequestError(
    "provider_not_configured",
    500,
    "AI provider is not configured.",
  );
}
