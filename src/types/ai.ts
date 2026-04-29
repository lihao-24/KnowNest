export type AIAction =
  | "generate_summary"
  | "suggest_tags"
  | "suggest_category"
  | "improve_title"
  | "organize_content";

export type AIGenerateRequest = {
  action: AIAction;
  knowledgeItemId?: string;
  title?: string;
  content?: string;
};

export type AIGenerateResult =
  | { summary: string }
  | { tags: string[] }
  | { category: string; reason: string }
  | { title: string }
  | { content: string };

export type AIErrorCode =
  | "unauthorized"
  | "forbidden"
  | "invalid_request"
  | "invalid_action"
  | "content_empty"
  | "content_too_short"
  | "content_too_long"
  | "daily_limit_exceeded"
  | "provider_not_configured"
  | "provider_failed"
  | "empty_provider_response"
  | "invalid_provider_response";
