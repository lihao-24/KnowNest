"use client";

import { useState } from "react";

import {
  buildMarkdownEditPreviewState,
  getInitialMarkdownEditPreviewMode,
  getNextMarkdownEditPreviewMode,
  type MarkdownEditPreviewMode,
} from "./markdown-edit-preview-model";
import { MarkdownEditor } from "./markdown-editor";
import { MarkdownPreview } from "./markdown-preview";

type MarkdownEditPreviewProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
};

const tabButtonClassName =
  "inline-flex h-9 flex-1 items-center justify-center rounded-md px-3 text-sm font-medium transition sm:flex-none";

function getTabButtonClassName(isActive: boolean) {
  return [
    tabButtonClassName,
    isActive
      ? "bg-white text-slate-950 shadow-sm"
      : "text-slate-600 hover:bg-white/70 hover:text-slate-950",
  ].join(" ");
}

export function MarkdownEditPreview({
  value,
  onChange,
  id,
  name,
  placeholder,
  disabled = false,
}: MarkdownEditPreviewProps) {
  const [mode, setMode] = useState<MarkdownEditPreviewMode>(
    getInitialMarkdownEditPreviewMode(),
  );
  const state = buildMarkdownEditPreviewState({
    content: value,
    mode,
    name,
  });

  function selectMode(nextMode: MarkdownEditPreviewMode) {
    setMode((currentMode) =>
      getNextMarkdownEditPreviewMode(currentMode, nextMode),
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      <div
        aria-label="正文显示模式"
        className="grid w-full grid-cols-2 gap-1 rounded-md bg-slate-100 p-1 sm:inline-grid sm:w-auto"
        role="tablist"
      >
        <button
          aria-selected={state.isEditing}
          className={getTabButtonClassName(state.isEditing)}
          disabled={disabled}
          onClick={() => selectMode("edit")}
          role="tab"
          type="button"
        >
          编辑
        </button>
        <button
          aria-selected={state.isPreviewing}
          className={getTabButtonClassName(state.isPreviewing)}
          disabled={disabled}
          onClick={() => selectMode("preview")}
          role="tab"
          type="button"
        >
          预览
        </button>
      </div>

      {state.isEditing ? (
        <MarkdownEditor
          disabled={disabled}
          id={id}
          name={state.contentField.name}
          onChange={onChange}
          placeholder={placeholder}
          value={state.contentField.value}
        />
      ) : (
        <>
          {state.contentField.name ? (
            <input
              name={state.contentField.name}
              type="hidden"
              value={state.contentField.value}
            />
          ) : null}
          <MarkdownPreview content={state.previewContent} />
        </>
      )}
    </div>
  );
}
