import { demoSessions } from "@/lib/chat/demo-data";
import type { ChatMessage, ChatSession } from "@/lib/chat/types";
import { hasDatabaseConnection } from "./client";

export type PersistChatTurnInput = {
  userId: string;
  userMessage: string;
  assistantMessage: ChatMessage;
};

export async function listChatSessionsForUser(userId: string): Promise<ChatSession[]> {
  void userId;

  if (!hasDatabaseConnection()) {
    return demoSessions;
  }

  return demoSessions;
}

export async function persistChatTurn(input: PersistChatTurnInput): Promise<void> {
  void input;

  if (!hasDatabaseConnection()) {
    return;
  }
}
