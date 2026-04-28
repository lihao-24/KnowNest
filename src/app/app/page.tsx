import Link from "next/link";

import { KnowledgeList } from "@/components/knowledge/knowledge-list";
import { TagFilter } from "@/components/tags/tag-filter";
import { getSelectedTagId } from "@/components/tags/tag-filter-model";
import { requireUser } from "@/lib/auth/server";
import { listKnowledgeItems } from "@/lib/db/knowledge-items";
import { attachTagsToKnowledgeItems, listTags } from "@/lib/db/tags";

type AppPageProps = {
  searchParams?: Promise<{
    tag?: string | string[] | undefined;
  }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = await searchParams;
  const requestedTagId = getSelectedTagId(resolvedSearchParams);
  const tags = await listTags(user.id);
  const selectedTagId = tags.some((tag) => tag.id === requestedTagId)
    ? requestedTagId
    : undefined;
  const items = await listKnowledgeItems(user.id, { tagId: selectedTagId });
  const itemsWithTags = await attachTagsToKnowledgeItems(user.id, items);

  return (
    <section className="w-full max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">全部内容</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            KnowNest
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            默认展示未归档内容，按最近更新时间排列。
          </p>
        </div>

        <Link
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/app/items/new"
        >
          新建知识
        </Link>
      </div>

      <TagFilter selectedTagId={selectedTagId} tags={tags} />
      <KnowledgeList items={itemsWithTags} />
    </section>
  );
}
