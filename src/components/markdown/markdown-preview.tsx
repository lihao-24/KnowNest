"use client";

import ReactMarkdown from "react-markdown";

import {
  buildMarkdownPreviewOptions,
  buildMarkdownPreviewState,
} from "./markdown-preview-model";

export type MarkdownPreviewProps = {
  content: string;
  className?: string;
  emptyText?: string;
};

const markdownPreviewClassName =
  "min-h-72 w-full min-w-0 max-w-full overflow-x-hidden rounded-md border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 sm:min-h-96";

export function MarkdownPreview({
  content,
  className,
  emptyText,
}: MarkdownPreviewProps) {
  const state = buildMarkdownPreviewState(content);
  const options = buildMarkdownPreviewOptions();

  return (
    <div
      className={[markdownPreviewClassName, className]
        .filter(Boolean)
        .join(" ")}
    >
      {state.isEmpty ? (
        <p className="text-slate-400">{emptyText ?? state.emptyText}</p>
      ) : (
        <div className="space-y-4 overflow-x-hidden break-words">
          <ReactMarkdown
            components={options.components}
            skipHtml={options.skipHtml}
          >
            {state.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
