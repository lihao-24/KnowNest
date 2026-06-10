import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { createSummary, toChatProfile } from "@/lib/chat/demo-data";
import { persistCandidateProfileForSession } from "@/lib/db/chat-repository";
import type { CandidateGoal, CandidateProfile, SubjectType } from "@/lib/profile/types";

const paramsSchema = z.object({
  sessionId: z.string().uuid()
});

const profileSchema = z.object({
  province: z.literal("河南").default("河南"),
  score: z.number().int().positive().nullable().optional(),
  rank: z.number().int().positive().nullable().optional(),
  subjectType: z.enum(["物理类", "历史类"]).nullable().optional(),
  eligibleNationalSpecialPlan: z.boolean().nullable().optional(),
  preferredRegions: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  interestedMajors: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  primaryGoal: z.enum(["稳定", "就业", "考公", "考研", "高薪", "离家近"]).nullable().optional()
});

export async function PATCH(
  request: Request,
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

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_PROFILE",
        detail: "画像字段格式不正确。"
      },
      { status: 400 }
    );
  }

  const profile = toCandidateProfile(parsed.data);
  await persistCandidateProfileForSession({
    userId: user.id,
    sessionId: params.data.sessionId,
    profile
  });

  return NextResponse.json({
    summary: createSummary(toChatProfile(profile))
  });
}

function toCandidateProfile(profile: z.infer<typeof profileSchema>): CandidateProfile {
  return {
    province: "河南",
    score: profile.score ?? undefined,
    rank: profile.rank ?? undefined,
    subjectType: (profile.subjectType ?? undefined) as SubjectType | undefined,
    eligibleNationalSpecialPlan: profile.eligibleNationalSpecialPlan ?? undefined,
    preferredRegions: profile.preferredRegions ?? [],
    excludedRegions: [],
    interestedMajors: profile.interestedMajors ?? [],
    excludedMajors: [],
    primaryGoal: (profile.primaryGoal ?? undefined) as CandidateGoal | undefined
  };
}
