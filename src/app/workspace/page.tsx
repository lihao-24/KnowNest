import { WorkspaceShell } from "@/components/WorkspaceShell";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { createSummary, emptyProfile, toChatProfile } from "@/lib/chat/demo-data";
import type { ChatSummary } from "@/lib/chat/types";
import {
  getLatestCandidateProfileForUser,
  listChatSessionsForUser
} from "@/lib/db/chat-repository";

export default async function WorkspacePage() {
  const user = await requireAuthenticatedUser();
  const [sessions, latestProfile] = await Promise.all([
    listChatSessionsForUser(user.id),
    getLatestCandidateProfileForUser(user.id)
  ]);

  return (
    <WorkspaceShell
      user={user}
      initialSessions={sessions}
      initialSummary={latestProfile ? createRestoredProfileSummary(latestProfile) : createSummary(emptyProfile)}
    />
  );
}

function createRestoredProfileSummary(
  latestProfile: NonNullable<Awaited<ReturnType<typeof getLatestCandidateProfileForUser>>>
): ChatSummary {
  const summary = createSummary(toChatProfile(latestProfile));

  return {
    ...summary,
    status: "资料未全",
    candidates: [],
    missingInfo: summary.missingInfo.length > 0 ? summary.missingInfo : ["发送下一轮消息以刷新候选"],
    verificationItems: ["已恢复最近一次考生画像；继续对话后再刷新候选和来源。"]
  };
}
