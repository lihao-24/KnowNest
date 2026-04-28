import Link from "next/link";

import type { Tag } from "../../types/tags";
import { buildTagFilterHref } from "./tag-filter-model";

type TagFilterProps = {
  tags: Tag[];
  selectedTagId: string | undefined;
  searchKeyword?: string | undefined;
  selectedSpace?: string | undefined;
  selectedStatus?: string | undefined;
  selectedType?: string | undefined;
  isFavoriteOnly?: boolean | undefined;
};

export function TagFilter({
  tags,
  selectedTagId,
  searchKeyword,
  selectedSpace,
  selectedStatus,
  selectedType,
  isFavoriteOnly,
}: TagFilterProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="标签筛选"
      className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-sm font-medium text-slate-800">标签</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = tag.id === selectedTagId;

            return (
              <Link
                aria-current={isSelected ? "true" : undefined}
                className={
                  isSelected
                    ? "inline-flex h-8 items-center rounded-md bg-teal-50 px-3 text-sm font-medium text-teal-800 ring-1 ring-inset ring-teal-100"
                    : "inline-flex h-8 items-center rounded-md bg-slate-100 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-950"
                }
                href={buildTagFilterHref({
                  currentSearchParams: {
                    q: searchKeyword,
                    space: selectedSpace,
                    status: selectedStatus,
                    type: selectedType,
                    favorite: isFavoriteOnly ? "true" : undefined,
                  },
                  currentTagId: selectedTagId,
                  nextTagId: tag.id,
                })}
                key={tag.id}
              >
                #{tag.name}
              </Link>
            );
          })}
          {selectedTagId ? (
            <Link
              className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              href={buildTagFilterHref({
                currentSearchParams: {
                  q: searchKeyword,
                  space: selectedSpace,
                  status: selectedStatus,
                  type: selectedType,
                  favorite: isFavoriteOnly ? "true" : undefined,
                },
                currentTagId: selectedTagId,
                nextTagId: undefined,
              })}
            >
              清除
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
