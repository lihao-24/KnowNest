"use client";

import { useActionState, useState } from "react";

import {
  KNOWLEDGE_SPACES,
  KNOWLEDGE_STATUSES,
  KNOWLEDGE_TYPES,
} from "@/constants/knowledge";
import {
  DELETE_KNOWLEDGE_ITEM_CONFIRMATION_MESSAGE,
  getDeleteKnowledgeItemConfirmationState,
  initialDeleteKnowledgeItemConfirmationState,
} from "@/lib/knowledge/knowledge-item-delete";
import {
  getKnowledgeItemFavoriteButtonLabel,
  getKnowledgeItemFavoriteStatusLabel,
} from "@/lib/knowledge/knowledge-item-favorite";
import type { KnowledgeItem } from "@/types/knowledge";

import {
  deleteKnowledgeItemAction,
  toggleKnowledgeItemFavoriteAction,
  updateKnowledgeItemAction,
} from "./actions";

const initialUpdateKnowledgeItemActionState = {
  errorMessage: "",
  successMessage: "",
};

const initialDeleteKnowledgeItemActionState = {
  errorMessage: "",
};

const selectClassName =
  "h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-sm";

type KnowledgeItemEditorProps = {
  item: KnowledgeItem;
};

export function KnowledgeItemEditor({ item }: KnowledgeItemEditorProps) {
  const updateKnowledgeItemWithId = updateKnowledgeItemAction.bind(
    null,
    item.id,
  );
  const deleteKnowledgeItemWithId = deleteKnowledgeItemAction.bind(
    null,
    item.id,
  );
  const toggleFavoriteWithId = toggleKnowledgeItemFavoriteAction.bind(
    null,
    item.id,
  );
  const [updateState, updateFormAction, isUpdating] = useActionState(
    updateKnowledgeItemWithId,
    initialUpdateKnowledgeItemActionState,
  );
  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    deleteKnowledgeItemWithId,
    initialDeleteKnowledgeItemActionState,
  );
  const [favoriteState, favoriteFormAction, isTogglingFavorite] =
    useActionState(toggleFavoriteWithId, {
      errorMessage: "",
      successMessage: "",
      isFavorite: item.is_favorite,
    });
  const [confirmationState, setConfirmationState] = useState(
    initialDeleteKnowledgeItemConfirmationState,
  );
  const isEditingDisabled = isUpdating || isDeleting;
  const isMutationDisabled = isUpdating || isDeleting || isTogglingFavorite;
  const isFavorite = favoriteState.isFavorite ?? item.is_favorite;
  const favoriteButtonLabel = getKnowledgeItemFavoriteButtonLabel(
    isFavorite,
    isTogglingFavorite,
  );
  const favoriteStatusLabel = getKnowledgeItemFavoriteStatusLabel(isFavorite);

  return (
    <div className="space-y-6">
      <form
        action={favoriteFormAction}
        className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-medium text-slate-700">收藏</p>
          <p
            aria-live="polite"
            className={`mt-1 min-h-6 text-sm leading-6 ${
              favoriteState.errorMessage ? "text-red-600" : "text-slate-600"
            }`}
            role={favoriteState.errorMessage ? "alert" : "status"}
          >
            {favoriteState.errorMessage ||
              favoriteState.successMessage ||
              favoriteStatusLabel}
          </p>
        </div>

        <input
          name="nextValue"
          type="hidden"
          value={String(!isFavorite)}
        />
        <button
          aria-pressed={isFavorite}
          className="inline-flex h-10 items-center justify-center rounded-md border border-amber-300 bg-white px-4 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          disabled={isMutationDisabled}
          type="submit"
        >
          <span aria-hidden="true" className="mr-2 text-base leading-none">
            {isFavorite ? "★" : "☆"}
          </span>
          {favoriteButtonLabel}
        </button>
      </form>

      <form action={updateFormAction} className="space-y-5">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="title"
          >
            标题
          </label>
          <input
            className="h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-sm"
            defaultValue={item.title}
            disabled={isEditingDisabled}
            id="title"
            name="title"
            placeholder="输入标题"
            type="text"
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="content"
          >
            正文
          </label>
          <textarea
            className="min-h-96 w-full min-w-0 resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-base leading-6 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-sm"
            defaultValue={item.content}
            disabled={isEditingDisabled}
            id="content"
            name="content"
            placeholder="记录正文内容"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="space"
            >
              空间
            </label>
            <select
              className={selectClassName}
              defaultValue={item.space}
              disabled={isEditingDisabled}
              id="space"
              name="space"
            >
              {KNOWLEDGE_SPACES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="type"
            >
              类型
            </label>
            <select
              className={selectClassName}
              defaultValue={item.type}
              disabled={isEditingDisabled}
              id="type"
              name="type"
            >
              {KNOWLEDGE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="status"
            >
              状态
            </label>
            <select
              className={selectClassName}
              defaultValue={item.status}
              disabled={isEditingDisabled}
              id="status"
              name="status"
            >
              {KNOWLEDGE_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            className={`min-h-6 text-sm leading-6 ${
              updateState.errorMessage ? "text-red-600" : "text-teal-700"
            }`}
            role="status"
          >
            {updateState.errorMessage || updateState.successMessage}
          </p>

          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isMutationDisabled}
            type="submit"
          >
            {isUpdating ? "保存中..." : "保存"}
          </button>
        </div>
      </form>

      <div className="border-t border-slate-200 pt-5">
        {confirmationState.isConfirming ? (
          <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              {DELETE_KNOWLEDGE_ITEM_CONFIRMATION_MESSAGE}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                disabled={isDeleting}
                onClick={() =>
                  setConfirmationState((currentState) =>
                    getDeleteKnowledgeItemConfirmationState(
                      currentState,
                      "cancel",
                    ),
                  )
                }
                type="button"
              >
                取消
              </button>

              <form action={deleteFormAction}>
                <button
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto"
                  disabled={isDeleting}
                  type="submit"
                >
                  {isDeleting ? "删除中..." : "确认删除"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-red-300 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            disabled={isMutationDisabled}
            onClick={() =>
              setConfirmationState((currentState) =>
                getDeleteKnowledgeItemConfirmationState(
                  currentState,
                  "request",
                ),
              )
            }
            type="button"
          >
            删除
          </button>
        )}

        {deleteState.errorMessage ? (
          <p
            aria-live="polite"
            className="mt-3 text-sm leading-6 text-red-600"
            role="alert"
          >
            {deleteState.errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
