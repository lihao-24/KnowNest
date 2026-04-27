export const DELETE_KNOWLEDGE_ITEM_CONFIRMATION_MESSAGE =
  "确定要删除这条知识吗？此操作无法撤销。";

export type DeleteKnowledgeItemConfirmationState = {
  isConfirming: boolean;
};

export type DeleteKnowledgeItemConfirmationEvent = "request" | "cancel";

export type DeleteKnowledgeItemPayload = {
  itemId: string;
};

export const initialDeleteKnowledgeItemConfirmationState: DeleteKnowledgeItemConfirmationState =
  {
    isConfirming: false,
  };

export function getDeleteKnowledgeItemConfirmationState(
  _state: DeleteKnowledgeItemConfirmationState,
  event: DeleteKnowledgeItemConfirmationEvent,
): DeleteKnowledgeItemConfirmationState {
  return {
    isConfirming: event === "request",
  };
}

export function buildDeleteKnowledgeItemPayload(
  itemId: string,
  formData: FormData,
): DeleteKnowledgeItemPayload {
  void formData;

  return {
    itemId,
  };
}
