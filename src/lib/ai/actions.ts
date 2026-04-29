import type { Category, KnowledgeItem } from "../../types/knowledge";
import type { Tag } from "../../types/tags";
import type { AIAction, AIGenerateRequest, AIErrorCode } from "../../types/ai";

export type AIGenerateContext = {
  action: AIAction;
  knowledgeItemId: string | null;
  title: string;
  content: string;
  existingTags: string[];
  existingCategories: string[];
};

export type AIGenerateContextDependencies = {
  getKnowledgeItemById: (
    userId: string,
    id: string,
  ) => Promise<KnowledgeItem | null>;
  listTagsByItemId: (userId: string, itemId: string) => Promise<Tag[]>;
  listCategories: (userId: string) => Promise<Category[]>;
};

const AI_ACTIONS = new Set<AIAction>([
  "generate_summary",
  "suggest_tags",
  "suggest_category",
  "improve_title",
  "organize_content",
]);

export function parseAIGenerateRequest(value: unknown): AIGenerateRequest {
  if (!isRecord(value)) {
    throw createAIRequestError("invalid_request", 400, "AI 请求参数无效。");
  }

  if (!isAIAction(value.action)) {
    throw createAIRequestError("invalid_action", 400, "不支持的 AI 操作。");
  }

  const knowledgeItemId = readOptionalString(value.knowledgeItemId);
  const title = readOptionalString(value.title);
  const content = readOptionalString(value.content);

  if (!knowledgeItemId && !content) {
    throw createAIRequestError(
      "invalid_request",
      400,
      "请提供知识 ID 或当前正文内容。",
    );
  }

  return {
    action: value.action,
    ...(knowledgeItemId ? { knowledgeItemId } : {}),
    ...(title ? { title } : {}),
    ...(content ? { content } : {}),
  };
}

export async function buildAIGenerateContext(
  userId: string,
  request: AIGenerateRequest,
  dependencies: AIGenerateContextDependencies = createDefaultDependencies(),
): Promise<AIGenerateContext> {
  const item = request.knowledgeItemId
    ? await dependencies.getKnowledgeItemById(userId, request.knowledgeItemId)
    : null;

  if (request.knowledgeItemId && !item) {
    throw createAIRequestError(
      "forbidden",
      403,
      "没有找到这条知识，或你没有访问权限。",
    );
  }

  const [tags, categories] = await Promise.all([
    request.knowledgeItemId
      ? dependencies.listTagsByItemId(userId, request.knowledgeItemId)
      : Promise.resolve([]),
    dependencies.listCategories(userId),
  ]);

  return {
    action: request.action,
    knowledgeItemId: request.knowledgeItemId ?? null,
    title: request.title ?? item?.title ?? "",
    content: request.content ?? item?.content ?? "",
    existingTags: tags.map((tag) => tag.name),
    existingCategories: categories.map((category) => category.name),
  };
}

function createDefaultDependencies(): AIGenerateContextDependencies {
  return {
    async getKnowledgeItemById(userId, id) {
      const mod = await import("../db/knowledge-items");
      return mod.getKnowledgeItemById(userId, id);
    },
    async listTagsByItemId(userId, itemId) {
      const mod = await import("../db/tags");
      return mod.listTagsByItemId(userId, itemId);
    },
    async listCategories(userId) {
      const mod = await import("../db/categories");
      return mod.listCategories(userId);
    },
  };
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isAIAction(value: unknown): value is AIAction {
  return typeof value === "string" && AI_ACTIONS.has(value as AIAction);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createAIRequestError(
  code: AIErrorCode,
  status: number,
  message: string,
): Error & { code: AIErrorCode; status: number } {
  const error = new Error(message) as Error & {
    code: AIErrorCode;
    status: number;
  };
  error.name = "AIRequestError";
  error.code = code;
  error.status = status;

  return error;
}
