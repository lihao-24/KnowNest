import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { runChatOrchestrator } from "@/lib/chat/orchestrator";
import type { CandidateGoal, CandidateProfile, SubjectType } from "@/lib/profile/types";

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  profile: z
    .object({
      province: z.literal("河南"),
      score: z.number().int().positive().nullable().optional(),
      rank: z.number().int().positive().nullable().optional(),
      subjectType: z.enum(["物理类", "历史类"]).nullable().optional(),
      eligibleNationalSpecialPlan: z.boolean().nullable().optional(),
      preferredRegions: z.array(z.string()).optional(),
      interestedMajors: z.array(z.string()).optional(),
      primaryGoal: z
        .enum(["稳定", "就业", "考公", "考研", "高薪", "离家近"])
        .nullable()
        .optional()
    })
    .optional()
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
    userId: user.id,
    existingProfile: parsed.data.profile ? toExistingProfile(parsed.data.profile) : undefined
  });

  return NextResponse.json(result);
}

function toExistingProfile(profile: z.infer<typeof chatRequestSchema>["profile"]): CandidateProfile {
  return {
    province: "河南",
    score: profile?.score ?? undefined,
    rank: profile?.rank ?? undefined,
    subjectType: (profile?.subjectType ?? undefined) as SubjectType | undefined,
    eligibleNationalSpecialPlan: profile?.eligibleNationalSpecialPlan ?? undefined,
    preferredRegions: profile?.preferredRegions ?? [],
    excludedRegions: [],
    interestedMajors: profile?.interestedMajors ?? [],
    excludedMajors: [],
    primaryGoal: (profile?.primaryGoal ?? undefined) as CandidateGoal | undefined
  };
}
