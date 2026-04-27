"use client";

import { useActionState } from "react";

import type { KnowledgeItem } from "@/types/knowledge";

import { updateKnowledgeItemAction } from "./actions";

const initialUpdateKnowledgeItemActionState = {
  errorMessage: "",
  successMessage: "",
};

type KnowledgeItemEditorProps = {
  item: KnowledgeItem;
};

export function KnowledgeItemEditor({ item }: KnowledgeItemEditorProps) {
  const updateKnowledgeItemWithId = updateKnowledgeItemAction.bind(
    null,
    item.id,
  );
  const [state, formAction, isPending] = useActionState(
    updateKnowledgeItemWithId,
    initialUpdateKnowledgeItemActionState,
  );

  return (
    <form action={formAction} className="space-y-5">
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
          disabled={isPending}
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
          disabled={isPending}
          id="content"
          name="content"
          placeholder="记录正文内容"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={`min-h-6 text-sm leading-6 ${
            state.errorMessage ? "text-red-600" : "text-teal-700"
          }`}
          role="status"
        >
          {state.errorMessage || state.successMessage}
        </p>

        <button
          className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
