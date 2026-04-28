"use server";

import { redirect } from "next/navigation";

import { AUTH_REQUIRED_MESSAGE, requireUser } from "@/lib/auth/server";
import { createKnowledgeItem } from "@/lib/db/knowledge-items";
import { updateItemTags } from "@/lib/db/tags";
import { buildKnowledgeItemDraftPayload } from "@/lib/knowledge/knowledge-item-draft";

const SAVE_KNOWLEDGE_ITEM_FAILED_MESSAGE = "保存失败，请稍后重试。";

type CreateKnowledgeItemActionState = {
  errorMessage: string;
};

export async function createKnowledgeItemAction(
  _previousState: CreateKnowledgeItemActionState,
  formData: FormData,
): Promise<CreateKnowledgeItemActionState> {
  const validation = buildKnowledgeItemDraftPayload(formData);

  if (!validation.ok) {
    return {
      errorMessage: validation.error,
    };
  }

  try {
    const user = await requireUser();

    const item = await createKnowledgeItem(user.id, {
      title: validation.value.title,
      content: validation.value.content,
      space: validation.value.space,
      type: validation.value.type,
      status: validation.value.status,
    });
    await updateItemTags(user.id, item.id, validation.value.tagNames);
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error && error.message === AUTH_REQUIRED_MESSAGE
          ? AUTH_REQUIRED_MESSAGE
          : SAVE_KNOWLEDGE_ITEM_FAILED_MESSAGE,
    };
  }

  redirect("/app?notice=created");
}
