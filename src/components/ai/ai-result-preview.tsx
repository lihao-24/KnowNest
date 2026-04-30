"use client";

import type { ReactNode } from "react";

type AIResultPreviewAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type AIResultPreviewProps = {
  actions?: AIResultPreviewAction[];
  children: ReactNode;
  errorMessage?: string;
  isApplying?: boolean;
  onCancel: () => void;
  title: string;
};

export function AIResultPreview({
  actions = [],
  children,
  errorMessage = "",
  isApplying = false,
  onCancel,
  title,
}: AIResultPreviewProps) {
  return (
    <div className="rounded-md border border-teal-200 bg-teal-50/60 p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {children}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p
          aria-live="polite"
          className="mt-3 text-sm leading-6 text-red-600"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {actions.map((action) => (
          <button
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:h-10 sm:w-auto"
            disabled={isApplying || action.disabled}
            key={action.label}
            onClick={action.onClick}
            type="button"
          >
            {action.label}
          </button>
        ))}
        <button
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 sm:h-10 sm:w-auto"
          disabled={isApplying}
          onClick={onCancel}
          type="button"
        >
          取消
        </button>
      </div>
    </div>
  );
}
