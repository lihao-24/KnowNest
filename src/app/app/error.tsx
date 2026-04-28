"use client";

import { listErrorFeedback } from "@/lib/knowledge/knowledge-feedback-state";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <section className="w-full max-w-3xl">
      <div className="rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-red-700">加载出错</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">
          {listErrorFeedback.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {listErrorFeedback.description}
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-slate-400">错误编号：{error.digest}</p>
        ) : null}
        <button
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          onClick={reset}
          type="button"
        >
          {listErrorFeedback.retryLabel}
        </button>
      </div>
    </section>
  );
}
