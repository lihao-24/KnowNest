"use client";

import { useEffect } from "react";

import type { KnowledgeOperationNotice } from "@/lib/knowledge/knowledge-feedback-state";

type KnowledgeOperationNoticeProps = {
  notice?: KnowledgeOperationNotice;
};

export function KnowledgeOperationNotice({
  notice,
}: KnowledgeOperationNoticeProps) {
  useEffect(() => {
    if (!notice || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    window.history.replaceState(window.history.state, "", url);
  }, [notice]);

  if (!notice) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className="mb-5 min-w-0 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-800"
      role="status"
    >
      {notice.message}
    </p>
  );
}
