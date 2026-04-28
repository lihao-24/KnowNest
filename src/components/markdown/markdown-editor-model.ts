type MarkdownEditorChangeEvent = {
  target: {
    value: string;
  };
};

type BuildMarkdownEditorTextareaPropsOptions = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const markdownEditorTextareaClassName =
  "min-h-72 w-full min-w-0 resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-base leading-6 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 sm:min-h-96 sm:text-sm";

export function buildMarkdownEditorTextareaProps({
  value,
  onChange,
  id,
  name,
  placeholder = "记录正文内容",
  disabled = false,
  className,
}: BuildMarkdownEditorTextareaPropsOptions) {
  return {
    className: [markdownEditorTextareaClassName, className]
      .filter(Boolean)
      .join(" "),
    disabled,
    id,
    name,
    onChange: (event: MarkdownEditorChangeEvent) => {
      onChange(event.target.value);
    },
    placeholder,
    value,
  };
}
