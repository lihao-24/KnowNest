import type {
  KnowledgeSpace,
  KnowledgeStatus,
  KnowledgeType,
} from "@/types/knowledge";

type KnowledgeOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export const KNOWLEDGE_SPACES = [
  { value: "life", label: "生活" },
  { value: "work", label: "工作" },
] as const satisfies readonly KnowledgeOption<KnowledgeSpace>[];

export const KNOWLEDGE_STATUSES = [
  { value: "inbox", label: "收集箱" },
  { value: "organized", label: "已整理" },
  { value: "archived", label: "归档" },
] as const satisfies readonly KnowledgeOption<KnowledgeStatus>[];

export const KNOWLEDGE_TYPES = [
  { value: "note", label: "笔记" },
  { value: "link", label: "链接" },
  { value: "prompt", label: "Prompt" },
  { value: "project", label: "项目记录" },
  { value: "log", label: "日志" },
  { value: "excerpt", label: "摘录" },
  { value: "plan", label: "计划" },
  { value: "snippet", label: "代码片段" },
] as const satisfies readonly KnowledgeOption<KnowledgeType>[];
