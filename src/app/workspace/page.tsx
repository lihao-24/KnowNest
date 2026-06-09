import { WorkspaceShell } from "@/components/WorkspaceShell";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { createSummary, emptyProfile } from "@/lib/chat/demo-data";
import { listChatSessionsForUser } from "@/lib/db/chat-repository";

export default async function WorkspacePage() {
  const user = await requireAuthenticatedUser();
  const sessions = await listChatSessionsForUser(user.id);

  return (
    <WorkspaceShell
      user={user}
      initialSessions={sessions}
      initialSummary={createSummary(emptyProfile)}
    />
  );
}
