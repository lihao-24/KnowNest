import Link from "next/link";

import { appKnowledgeListDefaultEmptyState } from "@/lib/knowledge/knowledge-feedback-state";

import type { KnowledgeItem, KnowledgeItemWithTags } from "../../types/knowledge";
import { KnowledgeListItem } from "./knowledge-list-item";

type KnowledgeListProps = {
  items: Array<KnowledgeItem | KnowledgeItemWithTags>;
  isLoading?: boolean;
  emptyState?: {
    title: string;
    description: string;
    actionLabel: string;
  };
};

export function KnowledgeList({
  items,
  isLoading = false,
  emptyState = appKnowledgeListDefaultEmptyState,
}: KnowledgeListProps) {
  if (isLoading) {
    return (
      <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        正在加载知识内容...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-w-0 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8">
        <h2 className="text-lg font-semibold text-slate-950">
          {emptyState.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {emptyState.description}
        </p>
        <Link
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 sm:h-10 sm:w-auto"
          href="/app/items/new"
        >
          {emptyState.actionLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      {items.map((item) => (
        <KnowledgeListItem item={item} key={item.id} />
      ))}
    </div>
  );
}
