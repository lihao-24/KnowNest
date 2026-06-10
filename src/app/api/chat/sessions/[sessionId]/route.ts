import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { createSummary, emptyProfile, toChatProfile } from "@/lib/chat/demo-data";
import type { ChatSummary } from "@/lib/chat/types";
import {
  getCandidateProfileForSession,
  listChatMessagesForSession
} from "@/lib/db/chat-repository";

const paramsSchema = z.object({
  sessionId: z.string().uuid()
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "INVALID_SESSION_ID" }, { status: 400 });
  }

  const [messages, profile] = await Promise.all([
    listChatMessagesForSession(user.id, params.data.sessionId),
    getCandidateProfileForSession(user.id, params.data.sessionId)
  ]);

  return NextResponse.json({
    messages,
    summary: profile ? createSessionProfileSummary(profile) : createSummary(emptyProfile)
  });
}

function createSessionProfileSummary(
  profile: NonNullable<Awaited<ReturnType<typeof getCandidateProfileForSession>>>
): ChatSummary {
  const summary = createSummary(toChatProfile(profile));

  return {
    ...summary,
    status: "资料未全",
    candidates: [],
    missingInfo: summary.missingInfo.length > 0 ? summary.missingInfo : ["发送下一轮消息以刷新候选"],
    verificationItems: ["已恢复当前会话考生画像；继续对话后再刷新候选和来源。"]
  };
}
