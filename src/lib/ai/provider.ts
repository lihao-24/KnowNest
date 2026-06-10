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
    process.env.AI_DEFAULT_PROVIDER === "openai-compatible" &&
    Boolean(process.env.AI_PROVIDER_BASE_URL) &&
    Boolean(process.env.AI_PROVIDER_API_KEY) &&
    Boolean(process.env.AI_PROVIDER_MODEL);

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
  if (systemContext.includes("结构化招生数据未导入")) {
    return buildDataUnavailableReply(userMessage);
  }

  if (systemContext.includes("现在不能做完整冲稳保判断")) {
    const missingInfo = extractAfter(systemContext, "还缺：", "。") ?? "全省位次、核心诉求";

    return [
      "现在还不能直接给冲稳保方案。",
      "",
      `你刚才提供的是：${userMessage}。目前还缺：${missingInfo}。河南填报更看重全省位次，只看分数容易判断偏差。`,
      "",
      "你可以继续补一句，比如：“位次 3 万，想省内稳一点，不考虑国家专项”。信息补齐后，我再按近年录取位次和当年计划做初筛，不会凭感觉编学校。"
    ].join("\n");
  }

  return [
    "我先给你一个初筛方向，但这还不是最终填报结论。",
    "",
    summarizeCandidateCounts(systemContext),
    "当前候选仍需要继续核验官方来源、当年招生计划和招生章程。等真实数据补齐后，再看冲稳保分层会更可靠。"
  ].join("\n");
}

function buildDataUnavailableReply(userMessage: string): string {
  const directionAdvice = buildDirectionAdvice(userMessage);

  return [
    "现在还不能生成真实冲稳保候选。",
    "",
    `你补的方向我看到了：${userMessage}。${directionAdvice}`,
    "",
    "但涉及学校、专业、分数线、位次和计划数时，不能靠印象补。结构化招生数据还没有导入，所以我不会直接报学校清单。",
    "",
    "下一步先把官方近年录取位次和当年招生计划导进来，再按位次做冲稳保；在这之前，可以先把专业取舍、地域、预算和风险偏好聊清楚。"
  ].join("\n");
}

function buildDirectionAdvice(userMessage: string): string {
  const advice: string[] = [];

  if (/计算机|软件|人工智能/.test(userMessage)) {
    advice.push(
      "计算机方向别只看专业名，要一起看学校层次、数学基础、项目训练和未来考研空间。"
    );
  }

  if (/考研|读研|升学/.test(userMessage)) {
    advice.push("既然考虑考研，本科阶段的专业基础、学习氛围和学校平台就比短期热门更重要。");
  }

  if (/稳妥|稳定|稳一点|保守/.test(userMessage)) {
    advice.push("你又强调稳妥，那热门专业不能全往高位次学校里塞，得留出真正能兜底的选择。");
  }

  return advice.length > 0
    ? advice.join("")
    : "先把位次、诉求和不能接受的专业说清楚，比急着问学校名单更有用。";
}

function extractAfter(text: string, start: string, end: string): string | undefined {
  const startIndex = text.indexOf(start);
  if (startIndex < 0) {
    return undefined;
  }

  const valueStart = startIndex + start.length;
  const endIndex = text.indexOf(end, valueStart);
  const value = text.slice(valueStart, endIndex >= 0 ? endIndex : undefined).trim();

  return value || undefined;
}

function summarizeCandidateCounts(systemContext: string): string {
  const bucketSummary =
    extractAfter(systemContext, "生成候选：", "。") ??
    extractAfter(systemContext, "生成候选：", "当前") ??
    "已形成一批候选";

  return `按已导入数据初筛，${bucketSummary}。这些候选只代表可以继续核验，不代表稳录。`;
}
