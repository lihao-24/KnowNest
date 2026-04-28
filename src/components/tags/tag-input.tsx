"use client";

import { useId, useState, type KeyboardEvent } from "react";

import { addTagValue, removeTagValue } from "./tag-input-model";

export type TagInputProps = {
  value: string[];
  onChange: (nextTags: string[]) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function TagInput({
  value,
  onChange,
  id,
  label = "标签",
  placeholder = "输入标签后按 Enter",
  disabled = false,
  className,
}: TagInputProps) {
  const [draftTag, setDraftTag] = useState("");
  const generatedInputId = useId();
  const inputId = id ?? generatedInputId;

  function commitDraftTag() {
    const nextTags = addTagValue(value, draftTag);

    if (nextTags !== value) {
      onChange(nextTags);
    }

    if (draftTag.trim()) {
      setDraftTag("");
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    commitDraftTag();
  }

  function handleRemove(tagName: string) {
    const nextTags = removeTagValue(value, tagName);

    if (nextTags !== value) {
      onChange(nextTags);
    }
  }

  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <label
        className="block text-sm font-medium leading-6 text-slate-800"
        htmlFor={inputId}
      >
        {label}
      </label>

      <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-600/10">
        {value.length > 0 ? (
          <div className="mb-3 flex min-w-0 flex-wrap gap-2">
            {value.map((tagName) => (
              <span
                className="inline-flex min-h-9 max-w-full items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-700"
                key={tagName}
              >
                <span className="truncate">{tagName}</span>
                <button
                  aria-label={`删除标签 ${tagName}`}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={disabled}
                  onClick={() => handleRemove(tagName)}
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex min-w-0 gap-2">
          <input
            className="h-10 min-w-0 flex-1 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500 sm:text-sm"
            disabled={disabled}
            id={inputId}
            onChange={(event) => setDraftTag(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            type="text"
            value={draftTag}
          />
          <button
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950/20 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={disabled || !draftTag.trim()}
            onClick={commitDraftTag}
            type="button"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
