"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AUTH_REQUIRED_MESSAGE, requireUser } from "@/lib/auth/server";
import {
  deleteKnowledgeItem,
  toggleFavorite,
  updateKnowledgeItem,
} from "@/lib/db/knowledge-items";
import { buildDeleteKnowledgeItemPayload } from "@/lib/knowledge/knowledge-item-delete";
import { buildKnowledgeItemFavoritePayload } from "@/lib/knowledge/knowledge-item-favorite";
import { buildKnowledgeItemDraftPayload } from "@/lib/knowledge/knowledge-item-draft";

const DELETE_KNOWLEDGE_ITEM_FAILED_MESSAGE = "删除失败，请稍后重试。";
const DELETE_KNOWLEDGE_ITEM_NOT_FOUND_MESSAGE =
  "没有找到这条知识，或你没有访问权限。";
const UPDATE_KNOWLEDGE_ITEM_FAILED_MESSAGE = "保存失败，请稍后重试。";
const UPDATE_KNOWLEDGE_ITEM_NOT_FOUND_MESSAGE =
  "没有找到这条知识，或你没有访问权限。";
const UPDATE_KNOWLEDGE_ITEM_SUCCESS_MESSAGE = "已保存。";
const FAVORITE_KNOWLEDGE_ITEM_FAILED_MESSAGE = "收藏操作失败，请稍后重试。";
const FAVORITE_KNOWLEDGE_ITEM_NOT_FOUND_MESSAGE =
  "没有找到这条知识，或你没有访问权限。";

export type DeleteKnowledgeItemActionState = {
  errorMessage: string;
};

export type UpdateKnowledgeItemActionState = {
  errorMessage: string;
  successMessage: string;
};

export type ToggleKnowledgeItemFavoriteActionState = {
  errorMessage: string;
  successMessage: string;
  isFavorite?: boolean;
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
      space: validation.value.space,
      type: validation.value.type,
      status: validation.value.status,
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

export async function deleteKnowledgeItemAction(
  itemId: string,
  _previousState: DeleteKnowledgeItemActionState,
  formData: FormData,
): Promise<DeleteKnowledgeItemActionState> {
  const payload = buildDeleteKnowledgeItemPayload(itemId, formData);

  try {
    const user = await requireUser();
    const isDeleted = await deleteKnowledgeItem(user.id, payload.itemId);

    if (!isDeleted) {
      return {
        errorMessage: DELETE_KNOWLEDGE_ITEM_NOT_FOUND_MESSAGE,
      };
    }
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error && error.message === AUTH_REQUIRED_MESSAGE
          ? AUTH_REQUIRED_MESSAGE
          : DELETE_KNOWLEDGE_ITEM_FAILED_MESSAGE,
    };
  }

  revalidatePath("/app");
  revalidatePath(`/app/items/${payload.itemId}`);
  redirect("/app");
}

export async function toggleKnowledgeItemFavoriteAction(
  itemId: string,
  previousState: ToggleKnowledgeItemFavoriteActionState,
  formData: FormData,
): Promise<ToggleKnowledgeItemFavoriteActionState> {
  const payload = buildKnowledgeItemFavoritePayload(itemId, formData);

  if (!payload.ok) {
    return {
      errorMessage: payload.error,
      successMessage: "",
      isFavorite: previousState.isFavorite,
    };
  }

  try {
    const user = await requireUser();
    const updatedItem = await toggleFavorite(
      user.id,
      payload.value.itemId,
      payload.value.nextValue,
    );

    if (!updatedItem) {
      return {
        errorMessage: FAVORITE_KNOWLEDGE_ITEM_NOT_FOUND_MESSAGE,
        successMessage: "",
        isFavorite: previousState.isFavorite,
      };
    }

    revalidatePath("/app");
    revalidatePath(`/app/items/${payload.value.itemId}`);

    return {
      errorMessage: "",
      successMessage: updatedItem.is_favorite ? "已收藏。" : "已取消收藏。",
      isFavorite: updatedItem.is_favorite,
    };
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error && error.message === AUTH_REQUIRED_MESSAGE
          ? AUTH_REQUIRED_MESSAGE
          : FAVORITE_KNOWLEDGE_ITEM_FAILED_MESSAGE,
      successMessage: "",
      isFavorite: previousState.isFavorite,
    };
  }
}
