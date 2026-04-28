import Link from "next/link";

import { buildKnowledgeSearchClearHref } from "./knowledge-search-model";

type KnowledgeSearchProps = {
  keyword: string | undefined;
  selectedTagId: string | undefined;
  selectedSpace?: string | undefined;
  selectedStatus?: string | undefined;
  selectedType?: string | undefined;
};

export function KnowledgeSearch({
  keyword,
  selectedTagId,
  selectedSpace,
  selectedStatus,
  selectedType,
}: KnowledgeSearchProps) {
  return (
    <form
      action="/app"
      className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      method="get"
    >
      {selectedTagId ? (
        <input name="tag" type="hidden" value={selectedTagId} />
      ) : null}
      {selectedSpace ? (
        <input name="space" type="hidden" value={selectedSpace} />
      ) : null}
      {selectedStatus ? (
        <input name="status" type="hidden" value={selectedStatus} />
      ) : null}
      {selectedType ? (
        <input name="type" type="hidden" value={selectedType} />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-slate-800" htmlFor="q">
          搜索
        </label>
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          defaultValue={keyword ?? ""}
          id="q"
          name="q"
          placeholder="搜索标题或正文"
          type="search"
        />
        <div className="flex gap-2">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            type="submit"
          >
            搜索
          </button>
          {keyword ? (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              href={buildKnowledgeSearchClearHref({
                currentSearchParams: {
                  q: keyword,
                  tag: selectedTagId,
                  space: selectedSpace,
                  status: selectedStatus,
                  type: selectedType,
                },
              })}
            >
              清除
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}
