import Link from "next/link";

import { AIAssistantPanel } from "@/components/ai/ai-assistant-panel";
import { MarkdownPreview } from "@/components/markdown/markdown-preview";
import { requireUser } from "@/lib/auth/server";
import {
  getCategoryById,
  listCategoriesEnsuringDefaults,
} from "@/lib/db/categories";
import { getKnowledgeItemById } from "@/lib/db/knowledge-items";
import { listTagsByItemId } from "@/lib/db/tags";

import {
  appendKnowledgeItemOrganizedContentAction,
  applyKnowledgeItemCategoryAction,
  applyKnowledgeItemSummaryAction,
  applyKnowledgeItemTagsAction,
  applyKnowledgeItemTitleAction,
  replaceKnowledgeItemContentAction,
} from "./actions";

type KnowledgeItemPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function KnowledgeItemPage({
  params,
}: KnowledgeItemPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const item = await getKnowledgeItemById(user.id, id);

  if (!item) {
    return <KnowledgeItemNotFound />;
  }

  const tags = await listTagsByItemId(user.id, item.id);
  const category = item.category_id
    ? await getCategoryById(user.id, item.category_id)
    : null;
  const categories = await listCategoriesEnsuringDefaults(user.id);
  const summary = item.summary?.trim();
  const applySummary = applyKnowledgeItemSummaryAction.bind(null, item.id);
  const applyTags = applyKnowledgeItemTagsAction.bind(null, item.id);
  const applyCategory = applyKnowledgeItemCategoryAction.bind(null, item.id);
  const applyTitle = applyKnowledgeItemTitleAction.bind(null, item.id);
  const appendOrganizedContent =
    appendKnowledgeItemOrganizedContentAction.bind(null, item.id);
  const replaceContent = replaceKnowledgeItemContentAction.bind(null, item.id);

  return (
    <section className="min-w-0 w-full max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            className="text-sm font-medium text-teal-700 transition hover:text-teal-900"
            href="/app"
          >
            ← 返回全部内容
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
            {item.title || "未命名内容"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            阅读知识内容，或进入编辑页继续整理。
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <Link
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 sm:h-10 sm:w-auto"
            href={`/app/items/${item.id}/edit`}
          >
            编辑
          </Link>
          <div className="break-words text-sm leading-6 text-slate-500">
            <p>创建时间：{formatKnowledgeItemDateTime(item.created_at)}</p>
            <p>更新时间：{formatKnowledgeItemDateTime(item.updated_at)}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex min-w-0 flex-wrap gap-2 text-sm">
        <span className="max-w-full rounded-md bg-slate-100 px-3 py-1 text-slate-700">
          分类：{category?.name ?? "未分类"}
        </span>
        {tags.length > 0 ? (
          tags.map((tag) => (
            <Link
              className="max-w-full break-all rounded-md bg-teal-50 px-3 py-1 text-teal-700 transition hover:bg-teal-100"
              href={`/app?tag=${tag.id}`}
              key={tag.id}
            >
              #{tag.name}
            </Link>
          ))
        ) : (
          <span className="max-w-full rounded-md bg-slate-100 px-3 py-1 text-slate-500">
            暂无标签
          </span>
        )}
      </div>

      <AIAssistantPanel
        categories={categories}
        content={item.content}
        currentTagNames={tags.map((tag) => tag.name)}
        knowledgeItemId={item.id}
        onAppendContent={appendOrganizedContent}
        onApplyCategory={applyCategory}
        onApplySummary={applySummary}
        onApplyTags={applyTags}
        onApplyTitle={applyTitle}
        onReplaceContent={replaceContent}
        title={item.title}
      />

      <section className="mb-5 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-950">AI 摘要</h2>
        {summary ? (
          <>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
              {summary}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              生成时间：
              {formatNullableKnowledgeItemDateTime(item.summary_generated_at)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            暂无 AI 摘要
          </p>
        )}
      </section>

      <MarkdownPreview content={item.content} emptyText="暂无正文内容" />
    </section>
  );
}

function KnowledgeItemNotFound() {
  return (
    <section className="min-w-0 w-full max-w-3xl">
      <div className="min-w-0 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8">
        <h1 className="text-xl font-semibold text-slate-950">
          没有找到这条知识
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          它可能已被删除，或你没有访问权限。
        </p>
        <Link
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 sm:h-10 sm:w-auto"
          href="/app"
        >
          返回全部内容
        </Link>
      </div>
    </section>
  );
}

function formatKnowledgeItemDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatNullableKnowledgeItemDateTime(value: string | null) {
  return value ? formatKnowledgeItemDateTime(value) : "未知";
}
