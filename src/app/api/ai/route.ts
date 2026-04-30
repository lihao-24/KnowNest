import { AUTH_REQUIRED_MESSAGE, requireUser } from "@/lib/auth/server";
import { buildAIGenerateContext, parseAIGenerateRequest } from "@/lib/ai/actions";
import {
  readAIModelRegistry,
  readAIUsageConfig,
  resolveAIModelConfig,
} from "@/lib/ai/config";
import { toAIErrorResponse } from "@/lib/ai/errors";
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
import type { AIAction } from "@/types/ai";

export async function POST(request: Request) {
  let userId: string | null = null;
  let actionType: AIAction | null = null;
  let knowledgeItemId: string | null = null;
  let inputLength = 0;
  let model = "unknown";

  try {
    const user = await requireUser();
    userId = user.id;

    const config = readAIUsageConfig();
    const body = await readJsonBody(request);
    const aiRequest = parseAIGenerateRequest(body);
    actionType = aiRequest.action;

    const context = await buildAIGenerateContext(user.id, aiRequest);
    knowledgeItemId = context.knowledgeItemId;
    inputLength = context.content.length;

    validateAIInputLength(
      context.content,
      config.minInputChars,
      config.maxInputChars,
    );
    assertAIUsageAllowed(await countTodayAIUsage(user.id), config.dailyLimit);

    const registry = readAIModelRegistry();
    const resolvedModel = resolveAIModelConfig(aiRequest.modelId, registry);
    model = `${resolvedModel.id}:${resolvedModel.model}`;
    const provider = createAIProvider(resolvedModel);
    const result = await provider.generate({
      ...context,
      model: resolvedModel.model,
    });
    const validated = validateAIResult(context.action, result);

    await createAIUsageLog({
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
      await createAIUsageLog({
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

    const response = toAIErrorResponse(normalizeRouteError(error));
    return Response.json(response.body, { status: response.status });
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

function normalizeRouteError(error: unknown): unknown {
  if (error instanceof Error && error.message === AUTH_REQUIRED_MESSAGE) {
    const unauthorizedError = new Error(AUTH_REQUIRED_MESSAGE) as Error & {
      code: "unauthorized";
      status: number;
    };
    unauthorizedError.name = "AIRequestError";
    unauthorizedError.code = "unauthorized";
    unauthorizedError.status = 401;

    return unauthorizedError;
  }

  return error;
}
