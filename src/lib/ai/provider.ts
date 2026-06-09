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
    "目前结构化招生数据还没有导入，所以我不会编具体录取线或计划数。等位次、科类、目标和专项资格补齐后，规则层会先筛出冲稳保候选，再由 AI 负责解释依据、风险和核验清单。"
  ].join("\n");
}
