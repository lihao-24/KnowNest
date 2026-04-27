import { KnowledgeForm } from "./knowledge-form";

export default function NewKnowledgeItemPage() {
  return (
    <section className="w-full max-w-3xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-teal-700">新建知识</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          记录新的知识
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          写下标题或正文，也可以先设置空间、类型和状态。
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <KnowledgeForm />
      </div>
    </section>
  );
}
