import Link from "next/link";

import {
  KNOWLEDGE_SPACES,
  KNOWLEDGE_STATUSES,
  KNOWLEDGE_TYPES,
} from "@/constants/knowledge";

import {
  buildClearKnowledgeFiltersHref,
  buildKnowledgeFavoriteFilterHref,
} from "./knowledge-filters-model";
import {
  buildKnowledgeMetadataFilterHref,
  buildKnowledgeSortOrderHref,
  type KnowledgeMetadataFilters,
  type KnowledgeSortOrder,
} from "./knowledge-metadata-filter-model";
import type { Category } from "@/types/knowledge";

type KnowledgeMetadataFilterProps = {
  filters: KnowledgeMetadataFilters;
  categories: Category[];
  searchKeyword?: string | undefined;
  selectedTagId?: string | undefined;
  isFavoriteOnly?: boolean | undefined;
  sortOrder: KnowledgeSortOrder;
};

export function KnowledgeMetadataFilter({
  categories,
  filters,
  searchKeyword,
  selectedTagId,
  isFavoriteOnly,
  sortOrder,
}: KnowledgeMetadataFilterProps) {
  const currentSearchParams = {
    q: searchKeyword,
    tag: selectedTagId,
    space: filters.space,
    status: filters.status,
    type: filters.type,
    category: filters.categoryId,
    favorite: isFavoriteOnly ? "true" : undefined,
    order: sortOrder,
  };
  const hasSelectedMetadataFilter = Boolean(
    filters.space || filters.status || filters.type || filters.categoryId,
  );
  const hasSelectedFilter = Boolean(
    searchKeyword ||
      selectedTagId ||
      filters.space ||
      filters.status ||
      filters.type ||
      filters.categoryId ||
      isFavoriteOnly,
  );

  return (
    <section
      aria-label="元信息筛选"
      className="mb-4 min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4">
        <MetadataFilterGroup
          currentSearchParams={currentSearchParams}
          currentValue={filters.space}
          label="空间"
          nextFilterKey="space"
          options={KNOWLEDGE_SPACES}
        />
        <MetadataFilterGroup
          currentSearchParams={currentSearchParams}
          currentValue={filters.status}
          label="状态"
          nextFilterKey="status"
          options={KNOWLEDGE_STATUSES}
        />
        <MetadataFilterGroup
          currentSearchParams={currentSearchParams}
          currentValue={filters.type}
          label="类型"
          nextFilterKey="type"
          options={KNOWLEDGE_TYPES}
        />
        <MetadataFilterGroup
          currentSearchParams={currentSearchParams}
          currentValue={filters.categoryId}
          label="分类"
          nextFilterKey="categoryId"
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
        <SortFilterGroup
          currentSearchParams={currentSearchParams}
          currentValue={sortOrder}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="w-10 shrink-0 text-sm font-medium text-slate-800">
            收藏
          </p>
          <div className="flex min-w-0 flex-wrap gap-2">
            <Link
              aria-current={isFavoriteOnly ? undefined : "true"}
              className={
                isFavoriteOnly
                  ? "inline-flex min-h-10 max-w-full items-center rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-950"
                  : "inline-flex min-h-10 max-w-full items-center rounded-md bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 ring-1 ring-inset ring-teal-100"
              }
              href={buildKnowledgeFavoriteFilterHref({
                currentSearchParams,
                isFavorite: false,
              })}
            >
              全部
            </Link>
            <Link
              aria-current={isFavoriteOnly ? "true" : undefined}
              className={
                isFavoriteOnly
                  ? "inline-flex min-h-10 max-w-full items-center rounded-md bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 ring-1 ring-inset ring-teal-100"
                  : "inline-flex min-h-10 max-w-full items-center rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-950"
              }
              href={buildKnowledgeFavoriteFilterHref({
                currentSearchParams,
                isFavorite: true,
              })}
            >
              只看收藏
            </Link>
          </div>
        </div>
        {hasSelectedMetadataFilter || hasSelectedFilter ? (
          <div className="flex min-w-0 flex-wrap gap-2">
            {hasSelectedMetadataFilter ? (
              <Link
                className="inline-flex min-h-10 max-w-full items-center rounded-md px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                href={buildKnowledgeMetadataFilterHref({
                  currentSearchParams,
                  nextFilters: {
                    space: undefined,
                    status: undefined,
                    type: undefined,
                    categoryId: undefined,
                  },
                })}
              >
                清除元信息筛选
              </Link>
            ) : null}
            <Link
              className="inline-flex min-h-10 max-w-full items-center rounded-md px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              href={buildClearKnowledgeFiltersHref()}
            >
              清除全部筛选
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

type MetadataFilterGroupProps<TValue extends string> = {
  currentSearchParams: {
    q?: string | undefined;
    tag?: string | undefined;
    space?: string | undefined;
    status?: string | undefined;
    type?: string | undefined;
    category?: string | undefined;
    order?: string | undefined;
  };
  currentValue?: TValue | undefined;
  label: string;
  nextFilterKey: keyof KnowledgeMetadataFilters;
  options: readonly { value: TValue; label: string }[];
};

function MetadataFilterGroup<TValue extends string>({
  currentSearchParams,
  currentValue,
  label,
  nextFilterKey,
  options,
}: MetadataFilterGroupProps<TValue>) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <p className="w-10 shrink-0 text-sm font-medium text-slate-800">{label}</p>
      <div className="flex min-w-0 flex-wrap gap-2">
        <Link
          aria-current={currentValue === undefined ? "true" : undefined}
          className={
            currentValue === undefined
              ? "inline-flex min-h-10 max-w-full items-center rounded-md bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 ring-1 ring-inset ring-teal-100"
              : "inline-flex min-h-10 max-w-full items-center rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-950"
          }
          href={buildKnowledgeMetadataFilterHref({
            currentSearchParams,
            nextFilters: { [nextFilterKey]: undefined },
          })}
        >
          全部
        </Link>
        {options.map((option) => {
          const isSelected = option.value === currentValue;

          return (
            <Link
              aria-current={isSelected ? "true" : undefined}
              className={
                isSelected
                  ? "inline-flex min-h-10 max-w-full items-center rounded-md bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 ring-1 ring-inset ring-teal-100"
                  : "inline-flex min-h-10 max-w-full items-center rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-950"
              }
              href={buildKnowledgeMetadataFilterHref({
                currentSearchParams,
                nextFilters: { [nextFilterKey]: option.value },
              })}
              key={option.value}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SortFilterGroup({
  currentSearchParams,
  currentValue,
}: {
  currentSearchParams: {
    q?: string | undefined;
    tag?: string | undefined;
    space?: string | undefined;
    status?: string | undefined;
    type?: string | undefined;
    category?: string | undefined;
    favorite?: string | undefined;
    order?: string | undefined;
  };
  currentValue: KnowledgeSortOrder;
}) {
  const options: Array<{ value: KnowledgeSortOrder; label: string }> = [
    { value: "updated_at_desc", label: "最近更新" },
    { value: "created_at_desc", label: "最近创建" },
    { value: "created_at_asc", label: "最早创建" },
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <p className="w-10 shrink-0 text-sm font-medium text-slate-800">排序</p>
      <div className="flex min-w-0 flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option.value === currentValue;

          return (
            <Link
              aria-current={isSelected ? "true" : undefined}
              className={
                isSelected
                  ? "inline-flex min-h-10 max-w-full items-center rounded-md bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 ring-1 ring-inset ring-teal-100"
                  : "inline-flex min-h-10 max-w-full items-center rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-950"
              }
              href={buildKnowledgeSortOrderHref({
                currentSearchParams,
                nextOrder: option.value,
              })}
              key={option.value}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
