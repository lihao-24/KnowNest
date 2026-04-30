# OpenAI-compatible Model Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-controlled OpenAI-compatible model registry and a settings-page model selector that stores one browser-local default model.

**Architecture:** Server environment variables define an allowlist of model options. The browser stores only a selected `modelId` in `localStorage`; `/api/ai` resolves that untrusted ID through the server allowlist and creates a generic OpenAI-compatible provider. DeepSeek remains the default fallback and Xiaomi MiMo Token Plan is the first additional configured provider.

**Tech Stack:** Next.js App Router, React 19, TypeScript, OpenAI SDK, Drizzle/PostgreSQL for existing logs, lightweight Node `.test.mjs` tests.

---

## 0. Scope And Constraints

- Do not execute database migrations.
- Do not modify online/Vercel configuration.
- Do not commit, read, or output real API keys.
- Do not let the frontend send arbitrary `baseUrl`, `apiKey`, `apiKeyEnv`, or model names.
- Do not store model selection in the database.
- Do not implement non OpenAI-compatible native protocols.
- Preserve existing DeepSeek behavior when `AI_MODEL_OPTIONS` is not configured.
- Xiaomi MiMo must be configured as Token Plan, not the ordinary MiMo endpoint. Use `XIAOMI_MIMO_TOKEN_PLAN_BASE_URL` so the deployment can choose the correct region endpoint.

## 1. File Structure

Create:

- `src/lib/ai/openai-compatible.ts`  
  Generic OpenAI-compatible provider. Replaces provider-specific DeepSeek creation in the route.
- `src/lib/ai/provider-factory.ts`  
  Small factory mapping a resolved model config to an `AIProvider`.
- `src/lib/ai/provider-factory.test.mjs`  
  Verifies supported provider creation and unsupported provider rejection.
- `src/lib/ai/client-model-selection.ts`  
  Browser-safe localStorage helpers and pure selection resolver.
- `src/lib/ai/client-model-selection.test.mjs`  
  Tests model selection resolver and localStorage wrapper with a small in-memory storage stub.

Modify:

- `src/types/ai.ts`  
  Add optional `modelId` to `AIGenerateRequest`.
- `src/lib/ai/config.ts`  
  Add model registry parsing, public option projection, model resolution, and legacy DeepSeek fallback.
- `src/lib/ai/config.test.mjs`  
  Cover registry parsing, fallback, MiMo Token Plan env-based base URL, and missing key/base URL errors.
- `src/lib/ai/actions.ts`  
  Parse and preserve optional `modelId`.
- `src/lib/ai/actions.test.mjs`  
  Cover optional `modelId` trimming and invalid value ignoring.
- `src/app/api/ai/route.ts`  
  Resolve selected model through the registry and create provider through factory.
- `src/components/ai/ai-assistant-panel.tsx`  
  Include browser-selected `modelId` in `/api/ai` requests.
- `src/app/app/settings/page.tsx`  
  Read public model options on the server and pass them to settings UI.
- `src/app/app/settings/settings-model.ts`  
  Add public AI model settings view model.
- `src/app/app/settings/settings-model.test.mjs`  
  Verify model settings are public-only and default model ID is present.
- `src/app/app/settings/settings-panel.tsx`  
  Render AI model selector, save selected model ID to localStorage, support restoring default.
- `.env.example`  
  Add DeepSeek and Xiaomi MiMo Token Plan sample variables without real keys.
- `package.json`  
  Include new AI tests in `test:ai`.
- `docs/operations/v0.3-workflow-status.md`  
  After implementation/review passes, record Task 7A completion and make original Task 7 next.

## Task 1: AI Model Registry Configuration

**Files:**

- Modify: `src/types/ai.ts`
- Modify: `src/lib/ai/config.ts`
- Modify: `src/lib/ai/config.test.mjs`

- [ ] **Step 1: Write failing config tests**

Update `src/lib/ai/config.test.mjs` by keeping existing assertions and adding imports:

```js
import {
  getModelForAction,
  getPublicAIModelOptions,
  readAIConfig,
  readAIModelRegistry,
  resolveAIModelConfig,
} from "./config.ts";
```

Append these assertions:

```js
const fallbackRegistry = readAIModelRegistry({
  DEEPSEEK_API_KEY: "deepseek-key",
});

assert.equal(fallbackRegistry.defaultModelId, "deepseek-default");
assert.deepEqual(getPublicAIModelOptions(fallbackRegistry), [
  {
    id: "deepseek-default",
    label: "DeepSeek 默认",
    provider: "openai-compatible",
    model: "deepseek-v4-flash",
  },
]);

const resolvedFallbackModel = resolveAIModelConfig(
  "missing-model",
  fallbackRegistry,
  {
    DEEPSEEK_API_KEY: "deepseek-key",
  },
);

assert.deepEqual(resolvedFallbackModel, {
  id: "deepseek-default",
  label: "DeepSeek 默认",
  provider: "openai-compatible",
  apiKey: "deepseek-key",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
});

const registry = readAIModelRegistry({
  AI_DEFAULT_MODEL_ID: "xiaomi-mimo-token-plan-pro",
  DEEPSEEK_API_KEY: "deepseek-key",
  XIAOMI_MIMO_TOKEN_PLAN_API_KEY: "mimo-key",
  XIAOMI_MIMO_TOKEN_PLAN_BASE_URL: " https://token-plan-cn.xiaomimimo.com/v1 ",
  AI_MODEL_OPTIONS: JSON.stringify([
    {
      id: "deepseek-default",
      label: "DeepSeek 默认",
      provider: "openai-compatible",
      baseUrl: "https://api.deepseek.com",
      apiKeyEnv: "DEEPSEEK_API_KEY",
      model: "deepseek-v4-flash",
    },
    {
      id: "xiaomi-mimo-token-plan-pro",
      label: "Xiaomi MiMo Token Plan Pro",
      provider: "openai-compatible",
      baseUrlEnv: "XIAOMI_MIMO_TOKEN_PLAN_BASE_URL",
      apiKeyEnv: "XIAOMI_MIMO_TOKEN_PLAN_API_KEY",
      model: "mimo-v2-pro",
    },
  ]),
});

assert.equal(registry.defaultModelId, "xiaomi-mimo-token-plan-pro");
assert.deepEqual(getPublicAIModelOptions(registry), [
  {
    id: "deepseek-default",
    label: "DeepSeek 默认",
    provider: "openai-compatible",
    model: "deepseek-v4-flash",
  },
  {
    id: "xiaomi-mimo-token-plan-pro",
    label: "Xiaomi MiMo Token Plan Pro",
    provider: "openai-compatible",
    model: "mimo-v2-pro",
  },
]);

assert.deepEqual(
  resolveAIModelConfig("xiaomi-mimo-token-plan-pro", registry, {
    XIAOMI_MIMO_TOKEN_PLAN_API_KEY: "mimo-key",
    XIAOMI_MIMO_TOKEN_PLAN_BASE_URL: " https://token-plan-cn.xiaomimimo.com/v1 ",
  }),
  {
    id: "xiaomi-mimo-token-plan-pro",
    label: "Xiaomi MiMo Token Plan Pro",
    provider: "openai-compatible",
    apiKey: "mimo-key",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    model: "mimo-v2-pro",
  },
);

assert.throws(
  () =>
    readAIModelRegistry({
      AI_MODEL_OPTIONS: "{bad-json",
    }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "provider_not_configured",
);

assert.throws(
  () =>
    resolveAIModelConfig("xiaomi-mimo-token-plan-pro", registry, {
      XIAOMI_MIMO_TOKEN_PLAN_API_KEY: "mimo-key",
    }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "provider_not_configured",
);

assert.throws(
  () =>
    resolveAIModelConfig("xiaomi-mimo-token-plan-pro", registry, {
      XIAOMI_MIMO_TOKEN_PLAN_BASE_URL:
        "https://token-plan-cn.xiaomimimo.com/v1",
    }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "provider_not_configured",
);
```

- [ ] **Step 2: Run config tests and verify RED**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/config.test.mjs
```

Expected: FAIL because `readAIModelRegistry`, `getPublicAIModelOptions`, and `resolveAIModelConfig` are not exported yet.

- [ ] **Step 3: Extend AI request type**

Modify `src/types/ai.ts` so `AIGenerateRequest` includes:

```ts
export type AIGenerateRequest = {
  action: AIAction;
  knowledgeItemId?: string;
  title?: string;
  content?: string;
  modelId?: string;
};
```

- [ ] **Step 4: Implement registry types and parsing**

Modify `src/lib/ai/config.ts`. Keep `readAIConfig()` and `getModelForAction()` for backwards compatibility, then add:

```ts
export type AIModelProvider = "openai-compatible";

export type AIModelOption = {
  id: string;
  label: string;
  provider: AIModelProvider;
  baseUrl?: string;
  baseUrlEnv?: string;
  apiKeyEnv: string;
  model: string;
};

export type PublicAIModelOption = {
  id: string;
  label: string;
  provider: AIModelProvider;
  model: string;
};

export type AIModelRegistry = {
  defaultModelId: string;
  options: AIModelOption[];
};

export type ResolvedAIModelConfig = {
  id: string;
  label: string;
  provider: AIModelProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
};

const DEFAULT_MODEL_ID = "deepseek-default";
```

Add:

```ts
export function readAIModelRegistry(env: AIEnv = process.env): AIModelRegistry {
  const parsedOptions = readAIModelOptions(env);
  const options =
    parsedOptions.length > 0 ? parsedOptions : [buildDefaultDeepSeekOption(env)];
  const requestedDefaultId = readString(env.AI_DEFAULT_MODEL_ID, DEFAULT_MODEL_ID);
  const defaultModelId = options.some((option) => option.id === requestedDefaultId)
    ? requestedDefaultId
    : options[0].id;

  return {
    defaultModelId,
    options,
  };
}

export function getPublicAIModelOptions(
  registry: AIModelRegistry,
): PublicAIModelOption[] {
  return registry.options.map((option) => ({
    id: option.id,
    label: option.label,
    provider: option.provider,
    model: option.model,
  }));
}

export function resolveAIModelConfig(
  modelId: string | null | undefined,
  registry: AIModelRegistry,
  env: AIEnv = process.env,
): ResolvedAIModelConfig {
  const requestedModelId = modelId?.trim();
  const selectedOption =
    registry.options.find((option) => option.id === requestedModelId) ??
    registry.options.find((option) => option.id === registry.defaultModelId) ??
    registry.options[0];

  if (!selectedOption) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model options are not configured.",
    );
  }

  const apiKey = readString(env[selectedOption.apiKeyEnv], "");
  const baseUrl = selectedOption.baseUrlEnv
    ? readString(env[selectedOption.baseUrlEnv], "")
    : readString(selectedOption.baseUrl, "");

  if (!apiKey || !baseUrl) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model provider is not configured.",
    );
  }

  return {
    id: selectedOption.id,
    label: selectedOption.label,
    provider: selectedOption.provider,
    apiKey,
    baseUrl,
    model: selectedOption.model,
  };
}
```

Add helpers:

```ts
function readAIModelOptions(env: AIEnv): AIModelOption[] {
  const rawOptions = readString(env.AI_MODEL_OPTIONS, "");

  if (!rawOptions) {
    return [];
  }

  let value: unknown;

  try {
    value = JSON.parse(rawOptions);
  } catch {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model options are not valid JSON.",
    );
  }

  if (!Array.isArray(value)) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model options must be an array.",
    );
  }

  const options = value.map(parseAIModelOption);
  const uniqueIds = new Set<string>();

  for (const option of options) {
    if (uniqueIds.has(option.id)) {
      throw createAIRequestError(
        "provider_not_configured",
        500,
        "AI model option IDs must be unique.",
      );
    }

    uniqueIds.add(option.id);
  }

  return options;
}

function parseAIModelOption(value: unknown): AIModelOption {
  if (!isRecord(value)) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model option is invalid.",
    );
  }

  const id = readStringValue(value.id);
  const label = readStringValue(value.label);
  const provider = readStringValue(value.provider);
  const baseUrl = readStringValue(value.baseUrl);
  const baseUrlEnv = readStringValue(value.baseUrlEnv);
  const apiKeyEnv = readStringValue(value.apiKeyEnv);
  const model = readStringValue(value.model);

  if (
    !id ||
    !label ||
    provider !== "openai-compatible" ||
    (!baseUrl && !baseUrlEnv) ||
    !apiKeyEnv ||
    !model
  ) {
    throw createAIRequestError(
      "provider_not_configured",
      500,
      "AI model option is invalid.",
    );
  }

  return {
    id,
    label,
    provider,
    ...(baseUrl ? { baseUrl } : {}),
    ...(baseUrlEnv ? { baseUrlEnv } : {}),
    apiKeyEnv,
    model,
  };
}

function buildDefaultDeepSeekOption(env: AIEnv): AIModelOption {
  return {
    id: DEFAULT_MODEL_ID,
    label: "DeepSeek 默认",
    provider: "openai-compatible",
    baseUrl: readString(env.DEEPSEEK_BASE_URL, DEFAULT_BASE_URL),
    apiKeyEnv: "DEEPSEEK_API_KEY",
    model: readString(env.AI_MODEL_DEFAULT, DEFAULT_DEFAULT_MODEL),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
```

- [ ] **Step 5: Run config tests and verify GREEN**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/config.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add src/types/ai.ts src/lib/ai/config.ts src/lib/ai/config.test.mjs
git commit -m "feat(ai): add model registry config"
```

## Task 2: OpenAI-compatible Provider Factory

**Files:**

- Create: `src/lib/ai/openai-compatible.ts`
- Create: `src/lib/ai/provider-factory.ts`
- Create: `src/lib/ai/provider-factory.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing provider factory test**

Create `src/lib/ai/provider-factory.test.mjs`:

```js
import assert from "node:assert/strict";

import { createAIProvider } from "./provider-factory.ts";

const provider = createAIProvider({
  id: "deepseek-default",
  label: "DeepSeek 默认",
  provider: "openai-compatible",
  apiKey: "test-key",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
});

assert.equal(typeof provider.generate, "function");

assert.throws(
  () =>
    createAIProvider({
      id: "bad-provider",
      label: "Bad Provider",
      provider: "unsupported",
      apiKey: "test-key",
      baseUrl: "https://example.com",
      model: "bad-model",
    }),
  (error) =>
    error instanceof Error &&
    error.name === "AIRequestError" &&
    error.code === "provider_not_configured",
);
```

- [ ] **Step 2: Run provider test and verify RED**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/provider-factory.test.mjs
```

Expected: FAIL because `provider-factory.ts` does not exist.

- [ ] **Step 3: Create generic OpenAI-compatible provider**

Create `src/lib/ai/openai-compatible.ts`:

```ts
import "server-only";

import OpenAI from "openai";

import type { ResolvedAIModelConfig } from "./config";
import type { AIProvider } from "./provider";
import { buildAIMessages } from "./prompts";
import { parseAIJson } from "./schemas";

export function createOpenAICompatibleProvider(
  config: ResolvedAIModelConfig,
): AIProvider {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  return {
    async generate(params) {
      const completion = await client.chat.completions.create({
        model: params.model,
        messages: buildAIMessages(params),
        response_format: { type: "json_object" },
        stream: false,
      });
      const content = completion.choices[0]?.message?.content;

      return parseAIJson(content ?? "");
    },
  };
}
```

- [ ] **Step 4: Create provider factory**

Create `src/lib/ai/provider-factory.ts`:

```ts
import type { ResolvedAIModelConfig } from "./config";
import { createOpenAICompatibleProvider } from "./openai-compatible";
import type { AIProvider } from "./provider";

export function createAIProvider(config: ResolvedAIModelConfig): AIProvider {
  if (config.provider === "openai-compatible") {
    return createOpenAICompatibleProvider(config);
  }

  const error = new Error("AI provider is not configured.") as Error & {
    code: "provider_not_configured";
    status: number;
  };
  error.name = "AIRequestError";
  error.code = "provider_not_configured";
  error.status = 500;

  throw error;
}
```

- [ ] **Step 5: Add provider factory test to test:ai**

Modify `package.json` `test:ai` to include:

```json
"node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/provider-factory.test.mjs"
```

Place it after `config.test.mjs`.

- [ ] **Step 6: Run provider tests and verify GREEN**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/provider-factory.test.mjs
npm run test:ai
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

Run:

```bash
git add src/lib/ai/openai-compatible.ts src/lib/ai/provider-factory.ts src/lib/ai/provider-factory.test.mjs package.json
git commit -m "feat(ai): add openai compatible provider factory"
```

## Task 3: API Request And Route Model Selection

**Files:**

- Modify: `src/lib/ai/actions.ts`
- Modify: `src/lib/ai/actions.test.mjs`
- Modify: `src/app/api/ai/route.ts`

- [ ] **Step 1: Write failing action parse tests**

Append to `src/lib/ai/actions.test.mjs`:

```js
assert.deepEqual(
  parseAIGenerateRequest({
    action: "generate_summary",
    knowledgeItemId: " item-1 ",
    modelId: " xiaomi-mimo-token-plan-pro ",
  }),
  {
    action: "generate_summary",
    knowledgeItemId: "item-1",
    modelId: "xiaomi-mimo-token-plan-pro",
  },
);

assert.deepEqual(
  parseAIGenerateRequest({
    action: "generate_summary",
    knowledgeItemId: "item-1",
    modelId: 123,
  }),
  {
    action: "generate_summary",
    knowledgeItemId: "item-1",
  },
);
```

- [ ] **Step 2: Run action tests and verify RED**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/actions.test.mjs
```

Expected: FAIL because `modelId` is not preserved.

- [ ] **Step 3: Parse optional modelId**

Modify `src/lib/ai/actions.ts` inside `parseAIGenerateRequest()` so the returned request includes:

```ts
const modelId =
  typeof value.modelId === "string" && value.modelId.trim()
    ? value.modelId.trim()
    : undefined;
```

Return it only when present:

```ts
return {
  action: value.action,
  ...(knowledgeItemId ? { knowledgeItemId } : {}),
  ...(title ? { title } : {}),
  ...(content ? { content } : {}),
  ...(modelId ? { modelId } : {}),
};
```

- [ ] **Step 4: Route through registry and provider factory**

Modify `src/app/api/ai/route.ts` imports:

```ts
import {
  readAIConfig,
  readAIModelRegistry,
  resolveAIModelConfig,
} from "@/lib/ai/config";
import { createAIProvider } from "@/lib/ai/provider-factory";
```

Remove direct `createDeepSeekProvider` and `getModelForAction` imports.

Inside `POST()` replace:

```ts
model = getModelForAction(context.action, config);
const provider = createDeepSeekProvider(config);
const result = await provider.generate({ ...context, model });
```

with:

```ts
const registry = readAIModelRegistry();
const resolvedModel = resolveAIModelConfig(aiRequest.modelId, registry);
model = `${resolvedModel.id}:${resolvedModel.model}`;
const provider = createAIProvider(resolvedModel);
const result = await provider.generate({
  ...context,
  model: resolvedModel.model,
});
```

Keep `readAIConfig()` for daily limits and input length:

```ts
const config = readAIConfig();
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/actions.test.mjs
npm run test:ai
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add src/lib/ai/actions.ts src/lib/ai/actions.test.mjs src/app/api/ai/route.ts
git commit -m "feat(ai): route requests through selected model"
```

## Task 4: Browser Model Selection Utilities

**Files:**

- Create: `src/lib/ai/client-model-selection.ts`
- Create: `src/lib/ai/client-model-selection.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing client selection tests**

Create `src/lib/ai/client-model-selection.test.mjs`:

```js
import assert from "node:assert/strict";

import {
  AI_MODEL_SELECTION_STORAGE_KEY,
  clearStoredAIModelId,
  getStoredAIModelId,
  resolveSelectedAIModelId,
  setStoredAIModelId,
} from "./client-model-selection.ts";

const options = [
  {
    id: "deepseek-default",
    label: "DeepSeek 默认",
    provider: "openai-compatible",
    model: "deepseek-v4-flash",
  },
  {
    id: "xiaomi-mimo-token-plan-pro",
    label: "Xiaomi MiMo Token Plan Pro",
    provider: "openai-compatible",
    model: "mimo-v2-pro",
  },
];

assert.equal(AI_MODEL_SELECTION_STORAGE_KEY, "knownest.ai.modelId");
assert.equal(
  resolveSelectedAIModelId(
    options,
    "deepseek-default",
    "xiaomi-mimo-token-plan-pro",
  ),
  "xiaomi-mimo-token-plan-pro",
);
assert.equal(
  resolveSelectedAIModelId(options, "deepseek-default", "missing"),
  "deepseek-default",
);
assert.equal(
  resolveSelectedAIModelId(options, "missing-default", null),
  "deepseek-default",
);

const storage = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, value);
  },
  removeItem(key) {
    storage.delete(key);
  },
};

assert.equal(getStoredAIModelId(), null);
setStoredAIModelId(" xiaomi-mimo-token-plan-pro ");
assert.equal(getStoredAIModelId(), "xiaomi-mimo-token-plan-pro");
clearStoredAIModelId();
assert.equal(getStoredAIModelId(), null);
```

- [ ] **Step 2: Run client selection tests and verify RED**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/client-model-selection.test.mjs
```

Expected: FAIL because `client-model-selection.ts` does not exist.

- [ ] **Step 3: Implement client selection helpers**

Create `src/lib/ai/client-model-selection.ts`:

```ts
import type { PublicAIModelOption } from "./config";

export const AI_MODEL_SELECTION_STORAGE_KEY = "knownest.ai.modelId";

export function getStoredAIModelId(): string | null {
  if (!hasLocalStorage()) {
    return null;
  }

  return localStorage.getItem(AI_MODEL_SELECTION_STORAGE_KEY);
}

export function setStoredAIModelId(modelId: string): void {
  if (!hasLocalStorage()) {
    return;
  }

  const trimmedModelId = modelId.trim();

  if (trimmedModelId) {
    localStorage.setItem(AI_MODEL_SELECTION_STORAGE_KEY, trimmedModelId);
  }
}

export function clearStoredAIModelId(): void {
  if (!hasLocalStorage()) {
    return;
  }

  localStorage.removeItem(AI_MODEL_SELECTION_STORAGE_KEY);
}

export function resolveSelectedAIModelId(
  options: PublicAIModelOption[],
  defaultModelId: string,
  storedModelId: string | null,
): string {
  const fallbackModel =
    options.find((option) => option.id === defaultModelId) ?? options[0];
  const selectedModel = options.find((option) => option.id === storedModelId);

  return selectedModel?.id ?? fallbackModel?.id ?? "";
}

function hasLocalStorage(): boolean {
  return typeof localStorage !== "undefined";
}
```

- [ ] **Step 4: Add client selection test to test:ai**

Modify `package.json` `test:ai` to include:

```json
"node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/client-model-selection.test.mjs"
```

- [ ] **Step 5: Run tests and verify GREEN**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/client-model-selection.test.mjs
npm run test:ai
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add src/lib/ai/client-model-selection.ts src/lib/ai/client-model-selection.test.mjs package.json
git commit -m "feat(ai): add browser model selection helpers"
```

## Task 5: Settings Page Model Selector

**Files:**

- Modify: `src/app/app/settings/page.tsx`
- Modify: `src/app/app/settings/settings-model.ts`
- Modify: `src/app/app/settings/settings-model.test.mjs`
- Modify: `src/app/app/settings/settings-panel.tsx`

- [ ] **Step 1: Write failing settings model tests**

Modify `src/app/app/settings/settings-model.test.mjs` to pass AI model data:

```js
const settings = getSettingsViewModel(
  {
    email: "user@example.com",
  },
  {
    defaultModelId: "deepseek-default",
    modelOptions: [
      {
        id: "deepseek-default",
        label: "DeepSeek 默认",
        provider: "openai-compatible",
        model: "deepseek-v4-flash",
      },
      {
        id: "xiaomi-mimo-token-plan-pro",
        label: "Xiaomi MiMo Token Plan Pro",
        provider: "openai-compatible",
        model: "mimo-v2-pro",
      },
    ],
  },
);
```

Add assertions:

```js
assert.equal(settings.ai.defaultModelId, "deepseek-default");
assert.deepEqual(settings.ai.modelOptions, [
  {
    id: "deepseek-default",
    label: "DeepSeek 默认",
    provider: "openai-compatible",
    model: "deepseek-v4-flash",
  },
  {
    id: "xiaomi-mimo-token-plan-pro",
    label: "Xiaomi MiMo Token Plan Pro",
    provider: "openai-compatible",
    model: "mimo-v2-pro",
  },
]);
assert.equal(
  JSON.stringify(settings.ai).includes("apiKey"),
  false,
);
assert.equal(
  JSON.stringify(settings.ai).includes("baseUrl"),
  false,
);
```

Keep the existing no-email test by passing:

```js
{
  defaultModelId: "deepseek-default",
  modelOptions: [],
}
```

- [ ] **Step 2: Run settings tests and verify RED**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/app/app/settings/settings-model.test.mjs
```

Expected: FAIL because `getSettingsViewModel()` does not accept AI settings yet.

- [ ] **Step 3: Extend settings model**

Modify `src/app/app/settings/settings-model.ts`:

```ts
import type { PublicAIModelOption } from "@/lib/ai/config";
```

Add:

```ts
type SettingsAIModelInput = {
  defaultModelId: string;
  modelOptions: PublicAIModelOption[];
};
```

Extend `SettingsViewModel`:

```ts
ai: {
  defaultModelId: string;
  modelOptions: PublicAIModelOption[];
};
```

Change function signature:

```ts
export function getSettingsViewModel(
  user: SettingsUser,
  ai: SettingsAIModelInput = {
    defaultModelId: "",
    modelOptions: [],
  },
): SettingsViewModel {
```

Return:

```ts
ai: {
  defaultModelId: ai.defaultModelId,
  modelOptions: ai.modelOptions,
},
```

- [ ] **Step 4: Read model registry in settings page**

Modify `src/app/app/settings/page.tsx`:

```ts
import {
  getPublicAIModelOptions,
  readAIModelRegistry,
} from "@/lib/ai/config";
```

Inside `SettingsPage()`:

```ts
const registry = readAIModelRegistry();
const settings = getSettingsViewModel(user, {
  defaultModelId: registry.defaultModelId,
  modelOptions: getPublicAIModelOptions(registry),
});
```

- [ ] **Step 5: Render model selector in settings panel**

Modify `src/app/app/settings/settings-panel.tsx` imports:

```ts
import { useEffect, useMemo, useState } from "react";
import {
  clearStoredAIModelId,
  getStoredAIModelId,
  resolveSelectedAIModelId,
  setStoredAIModelId,
} from "@/lib/ai/client-model-selection";
```

Inside `SettingsPanel`, add state:

```ts
const [selectedModelId, setSelectedModelId] = useState(
  settings.ai.defaultModelId,
);

const selectedModel = useMemo(
  () =>
    settings.ai.modelOptions.find((option) => option.id === selectedModelId) ??
    settings.ai.modelOptions[0],
  [selectedModelId, settings.ai.modelOptions],
);

useEffect(() => {
  const resolvedModelId = resolveSelectedAIModelId(
    settings.ai.modelOptions,
    settings.ai.defaultModelId,
    getStoredAIModelId(),
  );
  setSelectedModelId(resolvedModelId);
}, [settings.ai.defaultModelId, settings.ai.modelOptions]);
```

Add handlers:

```ts
function handleModelChange(nextModelId: string) {
  setSelectedModelId(nextModelId);
  setStoredAIModelId(nextModelId);
}

function handleRestoreDefaultModel() {
  clearStoredAIModelId();
  setSelectedModelId(settings.ai.defaultModelId);
}
```

Add a section before logout:

```tsx
<div className="min-w-0 border-b border-slate-200 pb-5">
  <div className="min-w-0">
    <h2 className="text-base font-semibold">AI 模型</h2>
    <p className="mt-1 text-sm leading-6 text-slate-600">
      模型由服务端配置，API Key 不会暴露到浏览器。
    </p>
  </div>

  <div className="mt-4 grid gap-3">
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      默认模型
      <select
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        onChange={(event) => handleModelChange(event.target.value)}
        value={selectedModelId}
      >
        {settings.ai.modelOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>

    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 text-sm leading-6 text-slate-600">
        当前模型：{selectedModel?.label ?? "未配置"}。
      </p>
      <button
        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        onClick={handleRestoreDefaultModel}
        type="button"
      >
        恢复默认
      </button>
    </div>
  </div>
</div>
```

If `settings.ai.modelOptions.length === 0`, render:

```tsx
<p className="mt-3 text-sm leading-6 text-red-600">
  暂无可用 AI 模型，请检查服务端配置。
</p>
```

- [ ] **Step 6: Run settings tests and build**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/app/app/settings/settings-model.test.mjs
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit Task 5**

Run:

```bash
git add src/app/app/settings/page.tsx src/app/app/settings/settings-model.ts src/app/app/settings/settings-model.test.mjs src/app/app/settings/settings-panel.tsx
git commit -m "feat(settings): add ai model selector"
```

## Task 6: AI Assistant Sends Selected Model

**Files:**

- Modify: `src/components/ai/ai-assistant-panel.tsx`

- [ ] **Step 1: Update AI assistant request**

Modify `src/components/ai/ai-assistant-panel.tsx` imports:

```ts
import { getStoredAIModelId } from "@/lib/ai/client-model-selection";
```

Inside `handleGenerateSummary()`, before `fetch()`:

```ts
const modelId = getStoredAIModelId();
```

Change request body:

```ts
body: JSON.stringify({
  action: "generate_summary",
  knowledgeItemId,
  ...(modelId ? { modelId } : {}),
}),
```

- [ ] **Step 2: Run focused tests and build**

Run:

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/ai/ai-assistant-panel-model.test.mjs
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit Task 6**

Run:

```bash
git add src/components/ai/ai-assistant-panel.tsx
git commit -m "feat(ai): send selected model with ai requests"
```

## Task 7: Environment Example And Workflow Status

**Files:**

- Modify: `.env.example`
- Modify: `docs/operations/v0.3-workflow-status.md`

- [ ] **Step 1: Update .env.example**

Modify `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=

AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
AI_MODEL_FAST=deepseek-v4-flash
AI_MODEL_DEFAULT=deepseek-v4-flash
AI_MODEL_QUALITY=deepseek-v4-pro
AI_DAILY_LIMIT=20
AI_MAX_INPUT_CHARS=8000
AI_MIN_INPUT_CHARS=20

AI_DEFAULT_MODEL_ID=deepseek-default
XIAOMI_MIMO_TOKEN_PLAN_API_KEY=
XIAOMI_MIMO_TOKEN_PLAN_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
AI_MODEL_OPTIONS=[
  {
    "id": "deepseek-default",
    "label": "DeepSeek 默认",
    "provider": "openai-compatible",
    "baseUrl": "https://api.deepseek.com",
    "apiKeyEnv": "DEEPSEEK_API_KEY",
    "model": "deepseek-v4-flash"
  },
  {
    "id": "xiaomi-mimo-token-plan-pro",
    "label": "Xiaomi MiMo Token Plan Pro",
    "provider": "openai-compatible",
    "baseUrlEnv": "XIAOMI_MIMO_TOKEN_PLAN_BASE_URL",
    "apiKeyEnv": "XIAOMI_MIMO_TOKEN_PLAN_API_KEY",
    "model": "mimo-v2-pro"
  }
]
```

- [ ] **Step 2: Run full relevant verification**

Run:

```bash
npm run test:ai
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/app/app/settings/settings-model.test.mjs
npm run test:knowledge-list-item
npm run build
git diff --check
```

Expected: PASS.

- [ ] **Step 3: Update workflow status**

Modify `docs/operations/v0.3-workflow-status.md`:

- Record Task 7A completion.
- Record implementation summary.
- Record validation commands and results.
- Record implementation commit hash.
- Record remaining risk: real Xiaomi MiMo Token Plan endpoint/key must be configured manually and tested manually.
- Set current pending task back to original Task 7: 编辑页 AI 助手接入.

- [ ] **Step 4: Commit Task 7**

Run:

```bash
git add .env.example docs/operations/v0.3-workflow-status.md
git commit -m "docs(ops): record ai model selection status"
```

## Final Review Gate

After all implementation tasks:

- Run spec review against `docs/superpowers/specs/2026-04-30-openai-compatible-model-selection-design.md`.
- Run quality review on the full Task 7A diff.
- If reviewers find issues, dispatch a worker to fix them and repeat review.
- Do not continue to original Task 7 until Task 7A review passes.

## Expected Final Verification Commands

```bash
npm run test:ai
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/app/app/settings/settings-model.test.mjs
npm run test:knowledge-list-item
npm run build
git diff --check
```

All commands must pass before marking Task 7A complete.
