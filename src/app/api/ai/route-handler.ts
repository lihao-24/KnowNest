import {
  buildAIGenerateContext,
  parseAIGenerateRequest,
} from "@/lib/ai/actions";
import {
  getModelForAction,
  hasConfiguredAIModelOptions,
  readAIConfig,
  readAIModelRegistry,
  readAIUsageConfig,
  resolveAIModelConfig,
} from "@/lib/ai/config";
import { AIRequestError, toAIErrorResponse } from "@/lib/ai/errors";
import { createAIProvider } from "@/lib/ai/provider-factory";
import { validateAIResult } from "@/lib/ai/schemas";
import {
  assertAIUsageAllowed,
  validateAIInputLength,
} from "@/lib/ai/usage-limits";
import {
  countTodayAIUsage,
  createAIUsageLog,
} from "@/lib/db/ai-usage-logs";
import type { AIGenerateContext } from "@/lib/ai/actions";
import type { ResolvedAIModelConfig } from "@/lib/ai/config";
import type { AIProvider } from "@/lib/ai/provider";
import type { CreateAIUsageLogInput } from "@/lib/db/ai-usage-logs";
import type { AIAction } from "@/types/ai";

type CurrentUser = {
  id: string;
  email: string | null;
};

type AIRoutePostDependencies = {
  requireUser: () => Promise<CurrentUser>;
  buildAIGenerateContext: (
    userId: string,
    request: ReturnType<typeof parseAIGenerateRequest>,
  ) => Promise<AIGenerateContext>;
  countTodayAIUsage: (userId: string) => Promise<number>;
  createAIUsageLog: (input: CreateAIUsageLogInput) => Promise<void>;
  createAIProvider: (config: ResolvedAIModelConfig) => AIProvider;
};

export function createAIRoutePostHandler(
  dependencies: AIRoutePostDependencies = createDefaultRouteDependencies(),
) {
  return async function postAI(request: Request) {
    let userId: string | null = null;
    let actionType: AIAction | null = null;
    let knowledgeItemId: string | null = null;
    let inputLength = 0;
    let model = "unknown";

    try {
      const user = await dependencies.requireUser();
      userId = user.id;

      const config = readAIUsageConfig();
      const body = await readJsonBody(request);
      const aiRequest = parseAIGenerateRequest(body);
      actionType = aiRequest.action;

      const context = await dependencies.buildAIGenerateContext(
        user.id,
        aiRequest,
      );
      knowledgeItemId = context.knowledgeItemId;
      inputLength = context.content.length;

      validateAIInputLength(
        context.content,
        config.minInputChars,
        config.maxInputChars,
      );
      assertAIUsageAllowed(
        await dependencies.countTodayAIUsage(user.id),
        config.dailyLimit,
      );

      const registry = readAIModelRegistry();
      const resolvedModel = resolveRouteModel(
        aiRequest.modelId,
        context.action,
        registry,
      );
      model = `${resolvedModel.id}:${resolvedModel.model}`;
      const provider = dependencies.createAIProvider(resolvedModel);
      const result = await provider.generate({
        ...context,
        model: resolvedModel.model,
      });
      const validated = validateAIResult(context.action, result);

      await dependencies.createAIUsageLog({
        userId: user.id,
        knowledgeItemId: context.knowledgeItemId,
        actionType: context.action,
        model,
        status: "success",
        inputLength,
        outputLength: JSON.stringify(validated).length,
        errorMessage: null,
      });

      return Response.json({ ok: true, result: validated });
    } catch (error) {
      if (userId && actionType) {
        await dependencies.createAIUsageLog({
          userId,
          knowledgeItemId,
          actionType,
          model,
          status: "failed",
          inputLength,
          outputLength: 0,
          errorMessage: toSafeErrorMessage(error),
        }).catch(() => undefined);
      }

      const response = toAIErrorResponse(error);
      return Response.json(response.body, { status: response.status });
    }
  };
}

function resolveRouteModel(
  modelId: string | null | undefined,
  action: AIAction,
  registry: ReturnType<typeof readAIModelRegistry>,
): ResolvedAIModelConfig {
  const resolvedModel = resolveAIModelConfig(modelId, registry);

  if (modelId?.trim() || hasConfiguredAIModelOptions()) {
    return resolvedModel;
  }

  const legacyConfig = readAIConfig();

  return {
    ...resolvedModel,
    model: getModelForAction(action, legacyConfig),
  };
}

function createDefaultRouteDependencies(): AIRoutePostDependencies {
  return {
    requireUser: requireAuthenticatedUser,
    buildAIGenerateContext,
    countTodayAIUsage,
    createAIUsageLog,
    createAIProvider,
  };
}

async function requireAuthenticatedUser(): Promise<CurrentUser> {
  const { AUTH_REQUIRED_MESSAGE, requireUser } = await import(
    "@/lib/auth/server"
  );

  try {
    return await requireUser();
  } catch (error) {
    if (error instanceof Error && error.message === AUTH_REQUIRED_MESSAGE) {
      throw new AIRequestError("unauthorized", 401, AUTH_REQUIRED_MESSAGE);
    }

    throw error;
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function toSafeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "AI request failed.";
  return message.slice(0, 300);
}
