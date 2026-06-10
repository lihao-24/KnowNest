import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { deleteSavedChoiceForUser } from "@/lib/db/saved-choice-repository";

const paramsSchema = z.object({
  candidateId: z.string().trim().min(1)
});

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ candidateId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "INVALID_CANDIDATE_ID" }, { status: 400 });
  }

  const result = await deleteSavedChoiceForUser(
    user.id,
    decodeURIComponent(params.data.candidateId)
  );

  return NextResponse.json(result);
}
