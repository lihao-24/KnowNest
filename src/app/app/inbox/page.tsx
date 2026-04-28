import Link from "next/link";

import { KnowledgeList } from "@/components/knowledge/knowledge-list";
import { requireUser } from "@/lib/auth/server";
import { listKnowledgeItems } from "@/lib/db/knowledge-items";
import { attachTagsToKnowledgeItems } from "@/lib/db/tags";
import {
  buildInboxKnowledgeListParams,
  inboxKnowledgeListEmptyState,
  inboxPageHeader,
} from "@/lib/knowledge/inbox-page";

export default async function InboxPage() {
  const user = await requireUser();
  const items = await listKnowledgeItems(
    user.id,
    buildInboxKnowledgeListParams(),
  );
  const itemsWithTags = await attachTagsToKnowledgeItems(user.id, items);

  return (
    <section className="w-full max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">
            {inboxPageHeader.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            {inboxPageHeader.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {inboxPageHeader.description}
          </p>
        </div>

        <Link
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/app/items/new"
        >
          新建知识
        </Link>
      </div>

      <KnowledgeList
        emptyState={inboxKnowledgeListEmptyState}
        items={itemsWithTags}
      />
    </section>
  );
}
