import type { ChatSummary } from "@/lib/chat/types";

export type AiGenerationInput = {
  userMessage: string;
  systemContext: string;
  grounding?: AiGroundingContext;
};

export type AiGenerationResult = {
  content: string;
  provider: "demo" | "openai-compatible";
};

export type AiGroundingContext = {
  dataMode: "database" | "sample" | "empty";
  summary: ChatSummary;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

export async function generateAssistantText({
  userMessage,
  systemContext,
  grounding
}: AiGenerationInput): Promise<AiGenerationResult> {
  const providerConfig = getOpenAiCompatibleConfig();

  if (!providerConfig || !grounding) {
    return {
      provider: "demo",
      content: buildDemoAssistantText(userMessage, systemContext)
    };
  }

  try {
    const content = await callOpenAiCompatibleProvider(providerConfig, {
      userMessage,
      systemContext,
      grounding
    });

    if (!content || violatesGrounding(content, grounding.summary)) {
      return {
        provider: "demo",
        content: buildGroundingViolationReply(grounding)
      };
    }

    return {
      provider: "openai-compatible",
      content
    };
  } catch {
    return {
      provider: "demo",
      content: buildDemoAssistantText(userMessage, systemContext)
    };
  }
}

function buildGroundingViolationReply(grounding: AiGroundingContext): string {
  if (grounding.summary.candidates.length === 0) {
    return [
      "这轮暂时不能生成候选清单。",
      "",
      "当前没有服务端结构化候选，我不会凭感觉编学校。请先补齐缺失信息或导入可追溯招生数据，再继续做冲稳保判断。"
    ].join("\n");
  }

  return [
    "这轮模型回复没有通过候选边界校验，我先按服务端结构化结果给你安全版结论。",
    "",
    summarizeGroundedCandidates(grounding.summary),
    "我不会凭感觉编学校；上面只代表当前候选可以继续核验，不代表最终填报结论。"
  ].join("\n");
}

function summarizeGroundedCandidates(summary: ChatSummary): string {
  const candidateNames = summary.candidates
    .map((candidate) => `${candidate.bucket} · ${candidate.schoolName}（${candidate.majorName}）`)
    .join("；");

  return `当前结构化候选包括：${candidateNames}。`;
}

type OpenAiCompatibleConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

function getOpenAiCompatibleConfig(): OpenAiCompatibleConfig | null {
  const baseUrl = process.env.AI_PROVIDER_BASE_URL?.trim();
  const apiKey = process.env.AI_PROVIDER_API_KEY?.trim();
  const model = process.env.AI_PROVIDER_MODEL?.trim();

  if (
    process.env.AI_DEFAULT_PROVIDER !== "openai-compatible" ||
    !baseUrl ||
    !apiKey ||
    !model
  ) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    model,
    temperature: parseNumberEnv(process.env.AI_PROVIDER_TEMPERATURE, 0.2),
    maxTokens: Math.trunc(parseNumberEnv(process.env.AI_PROVIDER_MAX_TOKENS, 900))
  };
}

async function callOpenAiCompatibleProvider(
  config: OpenAiCompatibleConfig,
  input: Required<AiGenerationInput>
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: [
        {
          role: "system",
          content: buildGroundedSystemPrompt()
        },
        {
          role: "user",
          content: buildGroundedUserPrompt(input)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("AI provider request failed");
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;

  return typeof content === "string" ? content.trim() : "";
}

function buildGroundedSystemPrompt(): string {
  return [
    "你是河南高考志愿填报助手，只能解释服务端提供的结构化 summary。",
    "不得新增候选学校或专业，不得编造学校、专业、分数、位次或计划数。",
    "没有候选时，只能追问缺失信息或说明当前资料不足。",
    "涉及候选时，必须围绕候选 evidence、riskTags、sources 和 verificationItems 解释。",
    "必须区分官方数据、往年趋势、经验判断和待核验事项。",
    "不要暴露内部实现词，例如 API、数据库表名、规则层、admission_records、MVP。"
  ].join("\n");
}

function buildGroundedUserPrompt({ userMessage, systemContext, grounding }: Required<AiGenerationInput>): string {
  const summaryForModel = {
    dataMode: grounding.dataMode,
    status: grounding.summary.status,
    profile: grounding.summary.profile,
    missingInfo: grounding.summary.missingInfo,
    candidates: grounding.summary.candidates.map((candidate) => ({
      bucket: candidate.bucket,
      schoolName: candidate.schoolName,
      majorName: candidate.majorName,
      planType: candidate.planType,
      subjectType: candidate.subjectType,
      city: candidate.city,
      evidence: candidate.evidence,
      riskTags: candidate.riskTags,
      status: candidate.status
    })),
    sources: grounding.summary.sources,
    verificationItems: grounding.summary.verificationItems,
    boundary: systemContext
  };

  return [
    `用户最新消息：${userMessage}`,
    "请基于下面 JSON 生成中文回复。只能使用 JSON 中的候选和证据，不得新增候选。",
    JSON.stringify(summaryForModel, null, 2)
  ].join("\n\n");
}

function violatesGrounding(content: string, summary: ChatSummary): boolean {
  const knownSchoolNames = summary.candidates.map((candidate) => candidate.schoolName);
  if (knownSchoolNames.length === 0) {
    return hasCandidateLikeSchoolName(content);
  }

  const mentionedSchoolNames = Array.from(content.matchAll(/[\u4e00-\u9fa5A-Za-z0-9]+(?:大学|学院|学校)/g)).map(
    (match) => match[0]
  );

  return mentionedSchoolNames.some(
    (schoolName) => !knownSchoolNames.some((knownSchoolName) => schoolName.includes(knownSchoolName))
  );
}

function hasCandidateLikeSchoolName(content: string): boolean {
  return /[\u4e00-\u9fa5A-Za-z0-9]+(?:大学|学院|学校)/.test(content);
}

function parseNumberEnv(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
