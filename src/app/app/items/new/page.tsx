import { requireUser } from "@/lib/auth/server";
import { listCategories } from "@/lib/db/categories";

import { KnowledgeForm } from "./knowledge-form";

export default async function NewKnowledgeItemPage() {
  const user = await requireUser();
  const categories = await listCategories(user.id);

  return (
    <section className="min-w-0 w-full max-w-3xl">
      <div className="mb-8 min-w-0">
        <p className="text-sm font-medium text-teal-700">新建知识</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
          记录新的知识
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          写下标题或正文，也可以先设置空间、类型和状态。
        </p>
      </div>

      <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <KnowledgeForm categories={categories} />
      </div>
    </section>
  );
}
