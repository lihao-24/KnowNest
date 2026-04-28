export type KnowledgeEmptyState = {
  title: string;
  description: string;
  actionLabel: string;
};

export type KnowledgeFeedbackState = {
  title: string;
  description: string;
};

export type KnowledgeErrorFeedbackState = KnowledgeFeedbackState & {
  retryLabel: string;
};

export type KnowledgeOperationNotice = {
  message: string;
};

export type KnowledgeOperationNoticeSearchParams = {
  notice?: string | string[] | undefined;
};

export const appKnowledgeListDefaultEmptyState = {
  title: "还没有知识内容",
  description: "先创建第一条知识，开始搭建你的个人知识库。",
  actionLabel: "新建知识",
} as const satisfies KnowledgeEmptyState;

export const appKnowledgeListFilteredEmptyState = {
  title: "没有找到匹配内容",
  description: "换个条件再试试，或清除筛选查看默认列表。",
  actionLabel: "新建知识",
} as const satisfies KnowledgeEmptyState;

export const listLoadingFeedback = {
  title: "正在加载知识内容",
  description: "列表会在数据准备好后自动显示。",
} as const satisfies KnowledgeFeedbackState;

export const detailLoadingFeedback = {
  title: "正在加载知识详情",
  description: "编辑表单会在数据准备好后自动显示。",
} as const satisfies KnowledgeFeedbackState;

export const listErrorFeedback = {
  title: "内容加载失败",
  description: "刷新页面再试一次，或稍后重新打开应用。",
  retryLabel: "重试",
} as const satisfies KnowledgeErrorFeedbackState;

export const detailErrorFeedback = {
  title: "知识详情加载失败",
  description: "刷新页面再试一次，或返回列表后重新打开这条知识。",
  retryLabel: "重试",
} as const satisfies KnowledgeErrorFeedbackState;

export const appKnowledgeItemCreatedNotice = {
  message: "已保存。",
} as const satisfies KnowledgeOperationNotice;

export function getAppKnowledgeListEmptyState(
  hasFilters: boolean,
): KnowledgeEmptyState | undefined {
  return hasFilters ? appKnowledgeListFilteredEmptyState : undefined;
}

export function getAppKnowledgeOperationNotice(
  searchParams: KnowledgeOperationNoticeSearchParams | undefined,
): KnowledgeOperationNotice | undefined {
  const notice = Array.isArray(searchParams?.notice)
    ? searchParams.notice[0]
    : searchParams?.notice;

  return notice === "created" ? appKnowledgeItemCreatedNotice : undefined;
}
