import type { AIProviderGenerateParams } from "./provider";

const SYSTEM_PROMPT =
  "你是 KnowNest 的 AI 知识整理助手。你只能根据用户提供的标题、正文、标签和分类进行整理，不要编造原文没有的信息。必须返回 JSON，不要输出 Markdown 代码围栏，不要输出解释。";

export function buildAIMessages(params: AIProviderGenerateParams): Array<{
  role: "system" | "user";
  content: string;
}> {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: buildUserPrompt(params),
    },
  ];
}

function buildUserPrompt(params: AIProviderGenerateParams): string {
  const baseContext = [
    `标题：${params.title}`,
    `正文：${params.content}`,
    `已有标签：${formatList(params.existingTags)}`,
    `已有分类：${formatList(params.existingCategories)}`,
  ].join("\n");

  switch (params.action) {
    case "generate_summary":
      return `${baseContext}\n\n请生成 80 到 150 字的摘要。返回 JSON：{"summary":"摘要内容"}`;
    case "suggest_tags":
      return `${baseContext}\n\n请基于正文推荐 3 到 5 个标签，优先复用已有标签中合适的标签。返回 JSON：{"tags":["标签1","标签2","标签3"]}`;
    case "suggest_category":
      return `${baseContext}\n\n请从已有分类中推荐最合适的分类，并说明 reason。如果没有合适分类，也必须从已有分类中选择最接近的一项。返回 JSON：{"category":"分类名","reason":"推荐原因"}`;
    case "improve_title":
      return `${baseContext}\n\n请优化标题，使其清晰、具体且不超过 30 个字符。返回 JSON：{"title":"优化后的标题"}`;
    case "organize_content":
      return `${baseContext}\n\n请将正文整理为结构清晰的 Markdown，保持原意，不要编造原文没有的信息。返回 JSON：{"content":"整理后的 Markdown 正文"}`;
  }
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join("、") : "无";
}
