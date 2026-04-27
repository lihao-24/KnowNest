import Link from "next/link";

import { requireUser } from "@/lib/auth/server";
import { getKnowledgeItemById } from "@/lib/db/knowledge-items";

import { KnowledgeItemEditor } from "./knowledge-item-editor";

type KnowledgeItemPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function KnowledgeItemPage({
  params,
}: KnowledgeItemPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const item = await getKnowledgeItemById(user.id, id);

  if (!item) {
    return <KnowledgeItemNotFound />;
  }

  return (
    <section className="w-full max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="text-sm font-medium text-teal-700 transition hover:text-teal-900"
            href="/app"
          >
            ← 返回全部内容
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            编辑知识
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            修改标题或正文后保存，整理字段将在后续任务补齐。
          </p>
        </div>

        <div className="text-sm leading-6 text-slate-500">
          <p>创建时间：{formatKnowledgeItemDateTime(item.created_at)}</p>
          <p>更新时间：{formatKnowledgeItemDateTime(item.updated_at)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <KnowledgeItemEditor item={item} />
      </div>
    </section>
  );
}

function KnowledgeItemNotFound() {
  return (
    <section className="w-full max-w-3xl">
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-950">
          没有找到这条知识
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          它可能已被删除，或你没有访问权限。
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/app"
        >
          返回全部内容
        </Link>
      </div>
    </section>
  );
}

function formatKnowledgeItemDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
