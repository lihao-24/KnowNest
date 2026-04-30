import "server-only";

import OpenAI from "openai";

import type { ResolvedAIModelConfig } from "./config";
import type { AIProvider } from "./provider";
import { buildAIMessages } from "./prompts";
import { parseAIJson } from "./schemas";

export function createOpenAICompatibleProvider(
  config: ResolvedAIModelConfig,
): AIProvider {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  return {
    async generate(params) {
      const completion = await client.chat.completions.create({
        model: params.model,
        messages: buildAIMessages(params),
        response_format: { type: "json_object" },
        stream: false,
      });
      const content = completion.choices[0]?.message?.content;

      return parseAIJson(content ?? "");
    },
  };
}
