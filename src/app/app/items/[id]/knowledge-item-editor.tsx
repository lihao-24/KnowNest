"use client";

import { useActionState, useState } from "react";

import {
  KNOWLEDGE_SPACES,
  KNOWLEDGE_STATUSES,
  KNOWLEDGE_TYPES,
} from "@/constants/knowledge";
import { MarkdownEditPreview } from "@/components/markdown/markdown-edit-preview";
import { TagInput } from "@/components/tags/tag-input";
import {
  DELETE_KNOWLEDGE_ITEM_CONFIRMATION_MESSAGE,
  getDeleteKnowledgeItemConfirmationButtonState,
  getDeleteKnowledgeItemConfirmationState,
  initialDeleteKnowledgeItemConfirmationState,
} from "@/lib/knowledge/knowledge-item-delete";
import {
  getKnowledgeItemFavoriteButtonLabel,
  getKnowledgeItemFavoriteStatusLabel,
} from "@/lib/knowledge/knowledge-item-favorite";
import type { KnowledgeItem } from "@/types/knowledge";
import type { Category } from "@/types/knowledge";

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
  categories: Category[];
  initialTagNames?: string[];
};

export function KnowledgeItemEditor({
  categories,
  item,
  initialTagNames = [],
}: KnowledgeItemEditorProps) {
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
  const [content, setContent] = useState(item.content);
  const [tagNames, setTagNames] = useState(initialTagNames);
  const isEditingDisabled = isUpdating || isDeleting;
  const isMutationDisabled = isUpdating || isDeleting || isTogglingFavorite;
  const deleteConfirmationButtonState =
    getDeleteKnowledgeItemConfirmationButtonState({
      isDeleting,
      isMutationDisabled,
    });
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
        <div className="min-w-0">
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

        <input name="nextValue" type="hidden" value={String(!isFavorite)} />
        <button
          aria-pressed={isFavorite}
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-amber-300 bg-white px-4 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:h-10 sm:w-auto"
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
        {tagNames.map((tagName) => (
          <input key={tagName} name="tagNames" type="hidden" value={tagName} />
        ))}

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
          <MarkdownEditPreview
            disabled={isEditingDisabled}
            id="content"
            name="content"
            onChange={setContent}
            placeholder="记录正文内容"
            value={content}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="categoryId"
            >
              分类
            </label>
            <select
              className={selectClassName}
              defaultValue={item.category_id ?? ""}
              disabled={isEditingDisabled}
              id="categoryId"
              name="categoryId"
            >
              <option value="">未分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="categoryName"
            >
              新分类
            </label>
            <input
              className="h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-sm"
              disabled={isEditingDisabled}
              id="categoryName"
              maxLength={20}
              name="categoryName"
              placeholder="可选，填写后优先使用"
              type="text"
            />
          </div>
        </div>

        <TagInput
          disabled={isEditingDisabled}
          onChange={setTagNames}
          value={tagNames}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            className={`min-h-6 text-sm leading-6 ${
              updateState.errorMessage ? "text-red-600" : "text-teal-700"
            }`}
            role={updateState.errorMessage ? "alert" : "status"}
          >
            {updateState.errorMessage || updateState.successMessage}
          </p>

          <button
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
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
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 sm:h-10 sm:w-auto"
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
                  className="inline-flex h-11 w-full items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 sm:h-10 sm:w-auto"
                  disabled={deleteConfirmationButtonState.isDisabled}
                  type="submit"
                >
                  {deleteConfirmationButtonState.label}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <button
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-red-300 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:h-10 sm:w-auto"
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
