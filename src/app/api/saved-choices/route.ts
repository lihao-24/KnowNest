import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { listSavedChoicesForUser, saveChoiceForUser } from "@/lib/db/saved-choice-repository";

const saveChoiceSchema = z.object({
  sessionId: z.string().uuid().nullable().optional(),
  candidateId: z.string().trim().min(1).max(240),
  schoolName: z.string().trim().min(1).max(120),
  majorName: z.string().trim().max(120).nullable().optional(),
  batch: z.literal("本科批"),
  planType: z.enum(["普通本科批", "国家专项计划"]),
  bucket: z.enum(["冲", "稳", "保"]),
  rationale: z.string().trim().max(2000).nullable().optional(),
  riskTags: z.array(z.string().trim().max(80)).max(20).optional(),
  sources: z.array(z.record(z.string(), z.unknown())).max(20).optional(),
  note: z.string().trim().max(1000).nullable().optional()
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  return NextResponse.json({
    choices: await listSavedChoicesForUser(user.id)
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = saveChoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        detail: "候选项保存参数不完整。"
      },
      { status: 400 }
    );
  }

  const choice = await saveChoiceForUser({
    userId: user.id,
    ...parsed.data
  });

  return NextResponse.json({ choice });
}
