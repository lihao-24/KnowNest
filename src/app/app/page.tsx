import Link from "next/link";

import { KnowledgeList } from "@/components/knowledge/knowledge-list";
import { getKnowledgeFavoriteFilter } from "@/components/knowledge/knowledge-filters-model";
import { KnowledgeMetadataFilter } from "@/components/knowledge/knowledge-metadata-filter";
import {
  getKnowledgeMetadataFilters,
  getKnowledgeSortOrder,
} from "@/components/knowledge/knowledge-metadata-filter-model";
import { KnowledgeOperationNotice } from "@/components/knowledge/knowledge-operation-notice";
import { KnowledgeSearch } from "@/components/knowledge/knowledge-search";
import { getSearchKeyword } from "@/components/knowledge/knowledge-search-model";
import { TagFilter } from "@/components/tags/tag-filter";
import { getSelectedTagId } from "@/components/tags/tag-filter-model";
import { requireUser } from "@/lib/auth/server";
import {
  attachCategoriesToKnowledgeItems,
  listCategoriesEnsuringDefaults,
} from "@/lib/db/categories";
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
    category?: string | string[] | undefined;
    favorite?: string | string[] | undefined;
    order?: string | string[] | undefined;
    notice?: string | string[] | undefined;
  }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = await searchParams;
  const requestedTagId = getSelectedTagId(resolvedSearchParams);
  const keyword = getSearchKeyword(resolvedSearchParams);
  const metadataFilters = getKnowledgeMetadataFilters(resolvedSearchParams);
  const sortOrder = getKnowledgeSortOrder(resolvedSearchParams);
  const isFavoriteOnly = getKnowledgeFavoriteFilter(resolvedSearchParams);
  const [categories, tags] = await Promise.all([
    listCategoriesEnsuringDefaults(user.id),
    listTags(user.id),
  ]);
  const selectedCategoryId = categories.some(
    (category) => category.id === metadataFilters.categoryId,
  )
    ? metadataFilters.categoryId
    : undefined;
  const effectiveMetadataFilters = {
    ...metadataFilters,
    categoryId: selectedCategoryId,
  };
  const selectedTagId = tags.some((tag) => tag.id === requestedTagId)
    ? requestedTagId
    : undefined;
  const items = await listKnowledgeItems(user.id, {
    ...effectiveMetadataFilters,
    categoryId: selectedCategoryId,
    keyword,
    orderBy: sortOrder,
    tagId: selectedTagId,
    isFavorite: isFavoriteOnly,
  });
  const [itemsWithCategories, itemsWithTags] = await Promise.all([
    attachCategoriesToKnowledgeItems(
      user.id,
      items,
    ),
    attachTagsToKnowledgeItems(
      user.id,
      items,
    ),
  ]);
  const tagsByItemId = new Map(
    itemsWithTags.map((item) => [item.id, item.tags]),
  );
  const itemsWithMetadata = itemsWithCategories.map((item) => ({
    ...item,
    tags: tagsByItemId.get(item.id) ?? [],
  }));
  const hasFilters = Boolean(
    keyword ||
      selectedTagId ||
      selectedCategoryId ||
      effectiveMetadataFilters.space ||
      effectiveMetadataFilters.status ||
      effectiveMetadataFilters.type ||
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
        selectedSpace={effectiveMetadataFilters.space}
        selectedStatus={effectiveMetadataFilters.status}
        selectedCategoryId={selectedCategoryId}
        selectedTagId={selectedTagId}
        selectedType={effectiveMetadataFilters.type}
        isFavoriteOnly={isFavoriteOnly}
        sortOrder={sortOrder}
      />
      <KnowledgeMetadataFilter
        categories={categories}
        filters={effectiveMetadataFilters}
        isFavoriteOnly={isFavoriteOnly}
        searchKeyword={keyword}
        selectedTagId={selectedTagId}
        sortOrder={sortOrder}
      />
      <TagFilter
        searchKeyword={keyword}
        selectedSpace={effectiveMetadataFilters.space}
        selectedStatus={effectiveMetadataFilters.status}
        selectedCategoryId={selectedCategoryId}
        selectedTagId={selectedTagId}
        selectedType={effectiveMetadataFilters.type}
        isFavoriteOnly={isFavoriteOnly}
        sortOrder={sortOrder}
        tags={tags}
      />
      <KnowledgeList emptyState={emptyState} items={itemsWithMetadata} />
    </section>
  );
}
