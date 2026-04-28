"use client";

import { buildMarkdownEditorTextareaProps } from "./markdown-editor-model";

export type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function MarkdownEditor(props: MarkdownEditorProps) {
  return <textarea {...buildMarkdownEditorTextareaProps(props)} />;
}
