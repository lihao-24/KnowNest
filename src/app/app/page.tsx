import Link from "next/link";

import { KnowledgeList } from "@/components/knowledge/knowledge-list";
import { getKnowledgeFavoriteFilter } from "@/components/knowledge/knowledge-filters-model";
import { KnowledgeMetadataFilter } from "@/components/knowledge/knowledge-metadata-filter";
import { getKnowledgeMetadataFilters } from "@/components/knowledge/knowledge-metadata-filter-model";
import { KnowledgeOperationNotice } from "@/components/knowledge/knowledge-operation-notice";
import { KnowledgeSearch } from "@/components/knowledge/knowledge-search";
import { getSearchKeyword } from "@/components/knowledge/knowledge-search-model";
import { TagFilter } from "@/components/tags/tag-filter";
import { getSelectedTagId } from "@/components/tags/tag-filter-model";
import { requireUser } from "@/lib/auth/server";
import { listKnowledgeItems } from "@/lib/db/knowledge-items";
import { attachTagsToKnowledgeItems, listTags } from "@/lib/db/tags";
import {
  getAppKnowledgeListEmptyState,
  getAppKnowledgeOperationNotice,
} from "@/lib/knowledge/knowledge-feedback-state";

type AppPageProps = {
  searchParams?: Promise<{
    tag?: string | string[] | undefined;
    q?: string | string[] | undefined;
    space?: string | string[] | undefined;
    status?: string | string[] | undefined;
    type?: string | string[] | undefined;
    favorite?: string | string[] | undefined;
    notice?: string | string[] | undefined;
  }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = await searchParams;
  const requestedTagId = getSelectedTagId(resolvedSearchParams);
  const keyword = getSearchKeyword(resolvedSearchParams);
  const metadataFilters = getKnowledgeMetadataFilters(resolvedSearchParams);
  const isFavoriteOnly = getKnowledgeFavoriteFilter(resolvedSearchParams);
  const tags = await listTags(user.id);
  const selectedTagId = tags.some((tag) => tag.id === requestedTagId)
    ? requestedTagId
    : undefined;
  const items = await listKnowledgeItems(user.id, {
    keyword,
    tagId: selectedTagId,
    isFavorite: isFavoriteOnly,
    ...metadataFilters,
  });
  const itemsWithTags = await attachTagsToKnowledgeItems(user.id, items);
  const hasFilters = Boolean(
    keyword ||
      selectedTagId ||
      metadataFilters.space ||
      metadataFilters.status ||
      metadataFilters.type ||
      isFavoriteOnly,
  );
  const emptyState = getAppKnowledgeListEmptyState(hasFilters);
  const operationNotice = getAppKnowledgeOperationNotice(resolvedSearchParams);

  return (
    <section className="min-w-0 w-full max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-teal-700">全部内容</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
            KnowNest
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            默认展示未归档内容，按最近更新时间排列。
          </p>
        </div>

        <Link
          className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 sm:h-10 sm:w-auto"
          href="/app/items/new"
        >
          新建知识
        </Link>
      </div>

      <KnowledgeOperationNotice notice={operationNotice} />
      <KnowledgeSearch
        keyword={keyword}
        selectedSpace={metadataFilters.space}
        selectedStatus={metadataFilters.status}
        selectedTagId={selectedTagId}
        selectedType={metadataFilters.type}
        isFavoriteOnly={isFavoriteOnly}
      />
      <KnowledgeMetadataFilter
        filters={metadataFilters}
        isFavoriteOnly={isFavoriteOnly}
        searchKeyword={keyword}
        selectedTagId={selectedTagId}
      />
      <TagFilter
        searchKeyword={keyword}
        selectedSpace={metadataFilters.space}
        selectedStatus={metadataFilters.status}
        selectedTagId={selectedTagId}
        selectedType={metadataFilters.type}
        isFavoriteOnly={isFavoriteOnly}
        tags={tags}
      />
      <KnowledgeList emptyState={emptyState} items={itemsWithTags} />
    </section>
  );
}
