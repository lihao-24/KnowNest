"use client";

import { useState } from "react";

type AITagSuggestionsProps = {
  disabled?: boolean;
  onApply: (selectedTags: string[]) => void;
  tags: string[];
};

export function AITagSuggestions({
  disabled = false,
  onApply,
  tags,
}: AITagSuggestionsProps) {
  return (
    <AITagSuggestionsSelection
      disabled={disabled}
      key={tags.join("\0")}
      onApply={onApply}
      tags={tags}
    />
  );
}

function AITagSuggestionsSelection({
  disabled,
  onApply,
  tags,
}: Required<AITagSuggestionsProps>) {
  const [selectedTags, setSelectedTags] = useState(() => tags);

  function toggleTag(tagName: string) {
    setSelectedTags((currentTags) =>
      currentTags.includes(tagName)
        ? currentTags.filter((currentTag) => currentTag !== tagName)
        : [...currentTags, tagName],
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 flex-wrap gap-2">
        {tags.map((tagName) => {
          const isSelected = selectedTags.includes(tagName);

          return (
            <label
              className={[
                "inline-flex min-h-9 max-w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition",
                isSelected
                  ? "border-teal-300 bg-white text-teal-800"
                  : "border-slate-200 bg-white/70 text-slate-600",
              ].join(" ")}
              key={tagName}
            >
              <input
                checked={isSelected}
                className="size-4 accent-teal-700"
                disabled={disabled}
                onChange={() => toggleTag(tagName)}
                type="checkbox"
              />
              <span className="truncate">#{tagName}</span>
            </label>
          );
        })}
      </div>

      <button
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        disabled={disabled || selectedTags.length === 0}
        onClick={() => onApply(selectedTags)}
        type="button"
      >
        添加到知识
      </button>
    </div>
  );
}
