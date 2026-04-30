# OpenAI-compatible 模型服务与设置页模型选择设计

## 1. 背景

KnowNest V0.3 当前 AI 能力已经具备统一 `/api/ai`、DeepSeek Provider、Prompt、Schema 校验、日志与限流基础。当前实现中模型名可以通过环境变量配置，但 Provider 只支持 DeepSeek，`/api/ai` 也直接创建 `createDeepSeekProvider()`。

本设计目标是在不暴露 API Key、不落库保存用户偏好、不扩大到多模型配置中心的前提下，让系统支持多个 OpenAI-compatible 模型服务，并允许用户在设置页选择一个浏览器本地默认模型。

本次优先新增的第二个模型服务是 Xiaomi MiMo Token Plan。它不同于普通 MiMo API endpoint，必须通过 Token Plan endpoint 接入；具体区域 endpoint 由部署环境变量配置。

## 2. 产品范围

### 2.1 本次做

- 支持服务端通过环境变量预配置多个 OpenAI-compatible 模型选项。
- DeepSeek 继续作为默认模型。
- 设置页展示服务端已配置的模型清单。
- 用户在设置页选择一个默认模型。
- 选择结果保存到浏览器 `localStorage`，不写入数据库。
- AI 请求携带可选 `modelId`。
- 服务端只接受 allowlist 中的 `modelId`，并映射到真实 `apiKey`、`baseURL` 和模型名。
- 前端不显示、不保存、不传输真实 API Key。

### 2.2 本次不做

- 不让用户在页面输入 API Key。
- 不让用户在页面输入任意 Base URL 或模型名。
- 不把模型偏好保存到数据库。
- 不做按 action 分模型选择。
- 不做模型可用性在线探测。
- 不做非 OpenAI-compatible 的 Claude/Gemini 原生协议接入。
- 不改 Vercel 配置；只更新代码和示例/说明，真实环境变量仍由部署者手动配置。

## 3. 推荐方案

采用“服务端 allowlist + 设置页 localStorage 选择”。

部署者通过环境变量配置模型清单。设置页从服务端拿到公开清单，只包含 `id`、`label`、`provider`、`model` 等非敏感字段。用户选择后保存到 `localStorage`。AI 助手调用 `/api/ai` 时携带该 `modelId`。服务端根据 allowlist 解析，如果 ID 无效或已过期，则回退默认模型。

这个方案避免新增数据库表和 RLS 规则，同时保留服务端对真实 Provider 配置的完整控制权。

## 4. 环境变量设计

保留现有 DeepSeek 变量作为默认兜底：

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
AI_MODEL_FAST=deepseek-v4-flash
AI_MODEL_DEFAULT=deepseek-v4-flash
AI_MODEL_QUALITY=deepseek-v4-pro
```

新增推荐变量：

```env
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

兼容规则：

- 如果 `AI_MODEL_OPTIONS` 未配置，则从现有 DeepSeek 变量生成一个 `deepseek-default` 选项。
- 如果 `AI_DEFAULT_MODEL_ID` 未配置或不存在于清单中，则使用清单第一个选项。
- `apiKeyEnv` 是环境变量名，不是密钥值。
- `baseUrlEnv` 是环境变量名，不是 endpoint 值；用于 Token Plan 这类按区域区分 endpoint 的服务。
- 如果模型配置包含 `baseUrl`，直接使用该值；如果包含 `baseUrlEnv`，从环境变量读取 endpoint。
- Xiaomi MiMo Token Plan 的 base URL 不应写成普通平台 endpoint，应由 `XIAOMI_MIMO_TOKEN_PLAN_BASE_URL` 配置。常见区域应按官方 Token Plan 文档选择，例如中国区、欧洲区或其他区域 endpoint。
- 真实密钥只通过 `process.env[apiKeyEnv]` 在服务端读取。
- 公开给前端的模型清单不得包含 `apiKeyEnv`、`baseUrl` 或任何 key。

## 5. 服务端 AI 配置设计

在 `src/lib/ai/config.ts` 扩展配置读取能力。

核心类型：

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

export type ResolvedAIModelConfig = {
  id: string;
  label: string;
  provider: AIModelProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
};
```

建议导出函数：

```ts
export function readAIModelRegistry(env = process.env): AIModelRegistry;
export function getPublicAIModelOptions(
  registry: AIModelRegistry,
): PublicAIModelOption[];
export function resolveAIModelConfig(
  modelId: string | null | undefined,
  registry: AIModelRegistry,
  env = process.env,
): ResolvedAIModelConfig;
```

`resolveAIModelConfig()` 必须保证：

- 只使用 allowlist 中的模型配置。
- `modelId` 不存在时回退默认模型。
- `baseUrl` 和 `baseUrlEnv` 至少存在一个。
- `baseUrlEnv` 存在时，从服务端环境变量读取真实 endpoint。
- 对应 `baseUrlEnv` 缺失时抛出 `provider_not_configured`。
- 对应 `apiKeyEnv` 缺失时抛出 `provider_not_configured`。
- 不接受前端传来的 `baseUrl`、`model`、`apiKeyEnv`。

## 6. Provider 设计

新增通用 OpenAI-compatible Provider：

```txt
src/lib/ai/openai-compatible.ts
```

它复用当前 DeepSeek Provider 的调用模式：

```ts
export function createOpenAICompatibleProvider(
  config: ResolvedAIModelConfig,
): AIProvider;
```

调用参数保持：

```ts
{
  model: config.model,
  messages: buildAIMessages(params),
  response_format: { type: "json_object" },
  stream: false
}
```

新增 provider factory：

```txt
src/lib/ai/provider-factory.ts
```

```ts
export function createAIProvider(config: ResolvedAIModelConfig): AIProvider;
```

当前只需要支持 `"openai-compatible"`。DeepSeek 也通过这个通用 Provider 接入。

## 7. `/api/ai` 请求设计

扩展 AI 请求类型，允许可选 `modelId`：

```json
{
  "action": "generate_summary",
  "knowledgeItemId": "uuid",
  "modelId": "deepseek-default"
}
```

规则：

- `modelId` 可选。
- 未传时使用默认模型。
- 传入过期或不存在的 ID 时回退默认模型。
- 日志中的 `model` 建议记录为 `${modelOption.id}:${model}`，例如 `deepseek-default:deepseek-v4-flash`。
- 其余认证、权限、限流、输入长度、Schema 校验流程保持不变。

`src/lib/ai/actions.ts` 的请求解析需要保留可选 `modelId`。服务端不得从请求中读取 `baseUrl`、`apiKey` 或任意模型名。

## 8. 设置页设计

设置页新增 “AI 模型” 区域。

展示内容：

- 当前浏览器选择的模型。
- 服务端已配置模型的下拉框。
- “恢复默认”按钮。
- 说明文案：模型由服务端配置，API Key 不会暴露到浏览器。

交互规则：

- 页面首次打开时，从 `localStorage` 读取 `knownest.ai.modelId`。
- 如果本地 ID 存在且在公开清单中，选中该模型。
- 如果本地 ID 不存在或已不在公开清单中，回退默认模型。
- 用户选择模型后写入 `localStorage`。
- 点击恢复默认时删除 `localStorage` 中的选择。
- 设置页不提交数据库，不调用服务端保存。

当前 `SettingsPanel` 已是 client component，适合承载这块交互。`SettingsPage` 作为 server page 可以读取公开模型清单并传入。

## 9. 前端模型选择工具

新增：

```txt
src/lib/ai/client-model-selection.ts
```

职责：

```ts
export const AI_MODEL_SELECTION_STORAGE_KEY = "knownest.ai.modelId";
export function getStoredAIModelId(): string | null;
export function setStoredAIModelId(modelId: string): void;
export function clearStoredAIModelId(): void;
export function resolveSelectedAIModelId(
  options: PublicAIModelOption[],
  defaultModelId: string,
  storedModelId: string | null,
): string;
```

AI 助手组件调用 `/api/ai` 时读取该本地选择并传入 `modelId`。如果读取不到，则不传或传默认 ID，服务端仍兜底。

## 10. 数据流

```txt
环境变量
  -> readAIModelRegistry()
  -> SettingsPage 公开模型清单
  -> SettingsPanel localStorage 保存 modelId
  -> AIAssistantPanel 读取 modelId
  -> POST /api/ai { action, knowledgeItemId/content, modelId }
  -> resolveAIModelConfig(modelId)
  -> createAIProvider(resolvedConfig)
  -> OpenAI-compatible API
  -> validateAIResult()
  -> ai_usage_logs 记录实际模型
```

## 11. 安全边界

- API Key 只存在于服务端环境变量。
- 前端只持有 `modelId`。
- `modelId` 是不可信输入，服务端必须用 allowlist 解析。
- 前端不可传入 `baseUrl`、`apiKeyEnv`、`apiKey` 或任意模型名。
- 配置错误不应暴露具体密钥名和值。
- 日志不记录正文，也不记录密钥。

## 12. 测试策略

建议新增或更新：

- `src/lib/ai/config.test.mjs`
  - 未配置 `AI_MODEL_OPTIONS` 时生成 DeepSeek 默认模型。
  - 可解析多个 OpenAI-compatible 模型。
  - JSON 格式错误返回配置错误。
  - 默认模型 ID 不存在时回退第一项。
  - `resolveAIModelConfig()` 对未知 `modelId` 回退默认。
  - 对应 `apiKeyEnv` 缺失时报 `provider_not_configured`。

- `src/lib/ai/actions.test.mjs`
  - `parseAIGenerateRequest()` 接受可选 `modelId`。
  - 非字符串或空白 `modelId` 被忽略。

- `src/app/app/settings/settings-model.test.mjs`
  - view model 包含公开模型清单和默认模型 ID。
  - 不包含 `apiKeyEnv`、`baseUrl` 或密钥。

- `src/lib/ai/client-model-selection.test.mjs`
  - 有效本地模型 ID 生效。
  - 过期 ID 回退默认。
  - 清除选择后回退默认。

- 构建验证：
  - `npm run build`

## 13. 实施建议

建议将该能力作为独立任务插入 V0.3，命名为：

```txt
Task 7A：OpenAI-compatible Provider Registry 与设置页模型选择
```

Task 7A 完成后，再继续原 Task 7 编辑页 AI 助手接入。这样可以先稳定模型选择和 Provider 边界，再把编辑页/新建页的 AI 调用统一接到新的 `modelId` 流程上。

建议文件范围：

```txt
src/lib/ai/config.ts
src/lib/ai/openai-compatible.ts
src/lib/ai/provider-factory.ts
src/lib/ai/actions.ts
src/app/api/ai/route.ts
src/app/app/settings/page.tsx
src/app/app/settings/settings-model.ts
src/app/app/settings/settings-panel.tsx
src/lib/ai/client-model-selection.ts
src/types/ai.ts
.env.example
相关 *.test.mjs
```

## 14. 验收标准

- 默认不配置 `AI_MODEL_OPTIONS` 时，现有 DeepSeek 摘要功能仍可用。
- 设置页可以看到一个或多个服务端配置的模型选项。
- 用户选择模型后刷新页面仍保留选择。
- 恢复默认后使用 DeepSeek 默认模型。
- `/api/ai` 收到未知 `modelId` 时不会调用任意外部地址，而是回退默认模型。
- 前端源码和响应中不包含真实 API Key。
- `ai_usage_logs.model` 能反映实际使用的模型选项和模型名。
- `npm run build` 通过。
