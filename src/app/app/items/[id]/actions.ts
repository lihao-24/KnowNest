"use server";

import { revalidatePath } from "next/cache";

import { AUTH_REQUIRED_MESSAGE, requireUser } from "@/lib/auth/server";
import { updateKnowledgeItem } from "@/lib/db/knowledge-items";
import { buildKnowledgeItemDraftPayload } from "@/lib/knowledge/knowledge-item-draft";

const UPDATE_KNOWLEDGE_ITEM_FAILED_MESSAGE = "保存失败，请稍后重试。";
const UPDATE_KNOWLEDGE_ITEM_NOT_FOUND_MESSAGE =
  "没有找到这条知识，或你没有访问权限。";
const UPDATE_KNOWLEDGE_ITEM_SUCCESS_MESSAGE = "已保存。";

export type UpdateKnowledgeItemActionState = {
  errorMessage: string;
  successMessage: string;
};

export async function updateKnowledgeItemAction(
  itemId: string,
  _previousState: UpdateKnowledgeItemActionState,
  formData: FormData,
): Promise<UpdateKnowledgeItemActionState> {
  const validation = buildKnowledgeItemDraftPayload(formData);

  if (!validation.ok) {
    return {
      errorMessage: validation.error,
      successMessage: "",
    };
  }

  try {
    const user = await requireUser();
    const updatedItem = await updateKnowledgeItem(user.id, itemId, {
      title: validation.value.title,
      content: validation.value.content,
    });

    if (!updatedItem) {
      return {
        errorMessage: UPDATE_KNOWLEDGE_ITEM_NOT_FOUND_MESSAGE,
        successMessage: "",
      };
    }
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error && error.message === AUTH_REQUIRED_MESSAGE
          ? AUTH_REQUIRED_MESSAGE
          : UPDATE_KNOWLEDGE_ITEM_FAILED_MESSAGE,
      successMessage: "",
    };
  }

  revalidatePath("/app");
  revalidatePath(`/app/items/${itemId}`);

  return {
    errorMessage: "",
    successMessage: UPDATE_KNOWLEDGE_ITEM_SUCCESS_MESSAGE,
  };
}
