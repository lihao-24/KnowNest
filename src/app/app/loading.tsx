import { listLoadingFeedback } from "@/lib/knowledge/knowledge-feedback-state";

export default function AppLoading() {
  return (
    <section className="w-full max-w-4xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-teal-700">正在加载</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          {listLoadingFeedback.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {listLoadingFeedback.description}
        </p>
      </div>

      <div
        aria-busy="true"
        aria-live="polite"
        className="space-y-3"
        role="status"
      >
        {[0, 1, 2].map((item) => (
          <div
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            key={item}
          >
            <div className="h-4 w-1/3 max-w-48 rounded bg-slate-200" />
            <div className="mt-4 h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
