"use client";

import { useActionState, useState } from "react";

import {
  KNOWLEDGE_SPACES,
  KNOWLEDGE_STATUSES,
  KNOWLEDGE_TYPES,
} from "@/constants/knowledge";
import { AIAssistantPanel } from "@/components/ai/ai-assistant-panel";
import { MarkdownEditPreview } from "@/components/markdown/markdown-edit-preview";
import { TagInput } from "@/components/tags/tag-input";
import type { Category } from "@/types/knowledge";

import { createKnowledgeItemAction } from "./actions";

const initialCreateKnowledgeItemActionState = {
  errorMessage: "",
};

const selectClassName =
  "h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-sm";

export function KnowledgeForm({ categories }: { categories: Category[] }) {
  const [state, formAction, isPending] = useActionState(
    createKnowledgeItemAction,
    initialCreateKnowledgeItemActionState,
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagNames, setTagNames] = useState<string[]>([]);

  return (
    <form action={formAction} className="space-y-5">
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
          disabled={isPending}
          id="title"
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="输入标题"
          type="text"
          value={title}
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
          disabled={isPending}
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
            defaultValue="work"
            disabled={isPending}
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
            defaultValue="note"
            disabled={isPending}
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
            defaultValue="inbox"
            disabled={isPending}
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
            disabled={isPending}
            id="categoryId"
            name="categoryId"
            onChange={(event) => setCategoryId(event.target.value)}
            value={categoryId}
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
            disabled={isPending}
            id="categoryName"
            maxLength={20}
            name="categoryName"
            placeholder="可选，填写后优先使用"
            type="text"
          />
        </div>
      </div>

      <TagInput
        disabled={isPending}
        onChange={setTagNames}
        value={tagNames}
      />

      <AIAssistantPanel
        categories={categories}
        content={content}
        currentTagNames={tagNames}
        onAppendContent={(nextContent) =>
          setContent((currentContent) =>
            [currentContent.trim(), nextContent.trim()]
              .filter(Boolean)
              .join("\n\n"),
          )
        }
        onApplyCategory={(nextCategoryId) => setCategoryId(nextCategoryId ?? "")}
        onApplyTags={setTagNames}
        onApplyTitle={setTitle}
        onReplaceContent={setContent}
        title={title}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className="min-h-6 text-sm leading-6 text-red-600"
          role={state.errorMessage ? "alert" : "status"}
        >
          {state.errorMessage}
        </p>

        <button
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
