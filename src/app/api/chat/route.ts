import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { runChatOrchestrator } from "@/lib/chat/orchestrator";

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000)
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        detail: "message 为必填字符串，且长度不能超过 4000。"
      },
      { status: 400 }
    );
  }

  const result = await runChatOrchestrator({
    message: parsed.data.message,
    userId: user.id
  });

  return NextResponse.json(result);
}
