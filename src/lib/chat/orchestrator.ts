import { generateAssistantText } from "@/lib/ai/provider";
import { listChatSessionsForUser, persistChatTurn } from "@/lib/db/chat-repository";
import { extractProfileFromMessage } from "@/lib/profile";
import { createSummary, toChatProfile } from "./demo-data";
import type { ChatOrchestratorInput, ChatOrchestratorResult } from "./types";

export async function runChatOrchestrator({
  message,
  userId
}: ChatOrchestratorInput): Promise<ChatOrchestratorResult> {
  const profile = extractProfileFromMessage(message);
  const summary = createSummary(toChatProfile(profile));
  const systemContext = buildSystemContext(summary.missingInfo);
  const generation = await generateAssistantText({
    userMessage: message,
    systemContext
  });
  const assistantMessage = {
    id: `assistant-${Date.now()}`,
    role: "assistant" as const,
    content: generation.content,
    createdAt: new Date().toISOString()
  };

  await persistChatTurn({
    userId,
    userMessage: message,
    assistantMessage
  });

  return {
    assistantMessage,
    summary,
    sessions: await listChatSessionsForUser(userId)
  };
}

function buildSystemContext(missingInfo: string[]): string {
  if (missingInfo.length > 0) {
    return `现在不能做完整冲稳保判断，还缺：${missingInfo.join("、")}。`;
  }

  return "硬信息已基本补齐；下一步应由规则层基于河南官方数据筛选候选，并标记来源与风险。";
}
