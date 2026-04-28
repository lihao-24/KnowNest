import { detailLoadingFeedback } from "@/lib/knowledge/knowledge-feedback-state";

export default function KnowledgeItemLoading() {
  return (
    <section className="w-full max-w-4xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-teal-700">正在加载</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          {detailLoadingFeedback.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {detailLoadingFeedback.description}
        </p>
      </div>

      <div
        aria-busy="true"
        aria-live="polite"
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        role="status"
      >
        <div className="h-10 w-full rounded-md bg-slate-100" />
        <div className="mt-5 h-32 w-full rounded-md bg-slate-100" />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div className="h-11 rounded-md bg-slate-100" key={item} />
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <div className="h-11 w-20 rounded-md bg-slate-200" />
        </div>
      </div>
    </section>
  );
}
