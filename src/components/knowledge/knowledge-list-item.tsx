import Link from "next/link";

import type { KnowledgeItem, KnowledgeItemWithTags } from "../../types/knowledge";
import { buildKnowledgeListItemViewModel } from "./knowledge-list-item-view-model";

export function KnowledgeListItem({
  item,
}: {
  item: KnowledgeItem | KnowledgeItemWithTags;
}) {
  const viewModel = buildKnowledgeListItemViewModel(item);

  return (
    <Link
      className="block min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/40 focus:outline-none focus:ring-2 focus:ring-teal-600/20 sm:p-5"
      href={`/app/items/${item.id}`}
    >
      <article aria-label={viewModel.title} className="min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <h2 className="min-w-0 break-words text-base font-semibold leading-6 text-slate-950">
            {viewModel.title}
          </h2>
          <span className="shrink-0 text-sm text-amber-500" title="收藏状态">
            {item.is_favorite ? "★" : "☆"}
            <span className="sr-only">{viewModel.favoriteLabel}</span>
          </span>
        </div>

        <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-slate-600">
          {viewModel.summary}
        </p>

        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="max-w-full rounded-md bg-slate-100 px-2 py-1">
            {viewModel.spaceLabel}
          </span>
          <span className="max-w-full rounded-md bg-slate-100 px-2 py-1">
            {viewModel.typeLabel}
          </span>
          <span className="max-w-full rounded-md bg-slate-100 px-2 py-1">
            {viewModel.statusLabel}
          </span>
          <span className="max-w-full break-all rounded-md bg-slate-100 px-2 py-1">
            {viewModel.categoryLabel}
          </span>
          {viewModel.tagNames.map((tagName) => (
            <span
              className="max-w-full break-all rounded-md bg-teal-50 px-2 py-1 text-teal-700"
              key={tagName}
            >
              #{tagName}
            </span>
          ))}
          <span className="ml-auto w-full text-slate-500 sm:w-auto">
            更新时间：{viewModel.updatedAtLabel}
          </span>
        </div>
      </article>
    </Link>
  );
}
