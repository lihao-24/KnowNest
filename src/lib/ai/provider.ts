export type AiGenerationInput = {
  userMessage: string;
  systemContext: string;
};

export type AiGenerationResult = {
  content: string;
  provider: "demo" | "openai-compatible";
};

export async function generateAssistantText({
  userMessage,
  systemContext
}: AiGenerationInput): Promise<AiGenerationResult> {
  const hasProviderConfig =
    Boolean(process.env.AI_DEFAULT_PROVIDER) && Boolean(process.env.AI_PROVIDER_OPTIONS);

  if (!hasProviderConfig) {
    return {
      provider: "demo",
      content: buildDemoAssistantText(userMessage, systemContext)
    };
  }

  return {
    provider: "openai-compatible",
    content: buildDemoAssistantText(userMessage, systemContext)
  };
}

function buildDemoAssistantText(userMessage: string, systemContext: string): string {
  return [
    "我先按本地 MVP 的服务端边界处理这轮问题。",
    "",
    systemContext,
    "",
    `你刚才说：${userMessage}`,
    "",
    "我不会编具体录取线或计划数；候选必须先由规则层基于结构化数据筛出，再由 AI 解释依据、风险和核验清单。"
  ].join("\n");
}
