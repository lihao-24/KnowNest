"use client";

import Link from "next/link";

import { detailErrorFeedback } from "@/lib/knowledge/knowledge-feedback-state";

type KnowledgeItemErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function KnowledgeItemError({
  error,
  reset,
}: KnowledgeItemErrorProps) {
  return (
    <section className="w-full max-w-3xl">
      <div className="rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-red-700">加载出错</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">
          {detailErrorFeedback.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {detailErrorFeedback.description}
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-slate-400">错误编号：{error.digest}</p>
        ) : null}
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            onClick={reset}
            type="button"
          >
            {detailErrorFeedback.retryLabel}
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            href="/app"
          >
            返回全部内容
          </Link>
        </div>
      </div>
    </section>
  );
}
