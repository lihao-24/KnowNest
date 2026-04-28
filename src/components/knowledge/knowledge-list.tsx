import Link from "next/link";

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

const defaultEmptyState = {
  title: "还没有知识内容",
  description: "先创建第一条知识，开始搭建你的个人知识库。",
  actionLabel: "新建知识",
};

export function KnowledgeList({
  items,
  isLoading = false,
  emptyState = defaultEmptyState,
}: KnowledgeListProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        正在加载知识内容...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-950">
          {emptyState.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {emptyState.description}
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/app/items/new"
        >
          {emptyState.actionLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <KnowledgeListItem item={item} key={item.id} />
      ))}
    </div>
  );
}
