import Link from "next/link";

import {
  KNOWLEDGE_SPACES,
  KNOWLEDGE_STATUSES,
  KNOWLEDGE_TYPES,
} from "@/constants/knowledge";

import {
  buildKnowledgeMetadataFilterHref,
  type KnowledgeMetadataFilters,
} from "./knowledge-metadata-filter-model";

type KnowledgeMetadataFilterProps = {
  filters: KnowledgeMetadataFilters;
  searchKeyword?: string | undefined;
  selectedTagId?: string | undefined;
};

export function KnowledgeMetadataFilter({
  filters,
  searchKeyword,
  selectedTagId,
}: KnowledgeMetadataFilterProps) {
  const currentSearchParams = {
    q: searchKeyword,
    tag: selectedTagId,
    space: filters.space,
    status: filters.status,
    type: filters.type,
  };
  const hasSelectedFilter = Boolean(filters.space || filters.status || filters.type);

  return (
    <section
      aria-label="元信息筛选"
      className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
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
        {hasSelectedFilter ? (
          <div>
            <Link
              className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              href={buildKnowledgeMetadataFilterHref({
                currentSearchParams,
                nextFilters: {
                  space: undefined,
                  status: undefined,
                  type: undefined,
                },
              })}
            >
              清除元信息筛选
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
      <div className="flex flex-wrap gap-2">
        <Link
          aria-current={currentValue === undefined ? "true" : undefined}
          className={
            currentValue === undefined
              ? "inline-flex h-8 items-center rounded-md bg-teal-50 px-3 text-sm font-medium text-teal-800 ring-1 ring-inset ring-teal-100"
              : "inline-flex h-8 items-center rounded-md bg-slate-100 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-950"
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
                  ? "inline-flex h-8 items-center rounded-md bg-teal-50 px-3 text-sm font-medium text-teal-800 ring-1 ring-inset ring-teal-100"
                  : "inline-flex h-8 items-center rounded-md bg-slate-100 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-950"
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
