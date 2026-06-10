import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createChatSessionForUser, listChatSessionsForUser } from "@/lib/db/chat-repository";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const session = await createChatSessionForUser(user.id);
  const sessions = await listChatSessionsForUser(user.id);

  return NextResponse.json({ session, sessions });
}
