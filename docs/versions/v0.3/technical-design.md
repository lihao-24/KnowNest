# KnowNest V0.3 Technical Design

## 1. 目标与边界

V0.3 的目标是把 KnowNest 从“手动整理知识”升级为“AI 辅助整理知识”。本版本首发接入 DeepSeek API，提供摘要生成、标签推荐、分类推荐、标题优化和正文整理能力。

本设计基于当前项目现状：

- 技术栈：Next.js App Router、React 19、TypeScript、Drizzle ORM、`pg`、Supabase Auth。
- 认证入口：`src/lib/auth/server.ts` 中的 `requireUser()`。
- 数据访问入口：`src/lib/db/*` repository 函数，所有业务查询显式携带 `userId`。
- 知识编辑入口：`src/app/app/items/new/knowledge-form.tsx` 与 `src/app/app/items/[id]/knowledge-item-editor.tsx`。
- 知识详情入口：`src/app/app/items/[id]/page.tsx`。
- 知识列表入口：`src/app/app/page.tsx`、`src/components/knowledge/knowledge-list-item-view-model.ts`。
- 数据库迁移目录：`db/migrations/`，当前已有 `0001_initial_schema.sql` 与 `0002_categories_search_sort.sql`。

本次 V0.3 设计遵守以下边界：

- 前端不直接调用 DeepSeek。
- 前端不暴露 `DEEPSEEK_API_KEY`。
- AI 生成接口只返回候选结果，不直接覆盖知识内容。
- 所有 AI 结果必须先预览，再由用户确认应用。
- AI 使用日志不保存完整正文。
- Supabase RLS 与现有 `user_id` 数据隔离策略保持不变。
- V0.3 不引入向量库、embedding、全知识库问答、文件解析、OCR、浏览器插件或多模型配置中心。

## 2. 总体架构

V0.3 采用“服务端统一 AI 网关 + 前端预览应用”的架构。

```txt
Client UI
  |
  | POST /api/ai
  v
src/app/api/ai/route.ts
  |
  | auth, ownership, input validation, rate limit, logging
  v
src/lib/ai/*
  |
  | OpenAI-compatible request
  v
DeepSeek API

AI result
  |
  v
Preview UI
  |
  | user confirms
  v
Server Action / existing repository
  |
  v
PostgreSQL / Supabase RLS
```

关键原则：

1. `/api/ai` 是唯一模型生成入口。
2. `/api/ai` 不负责持久化 AI 候选结果到 `knowledge_items`，只记录使用日志。
3. 用户点击“应用”后，才通过 Server Action 或现有保存流程写入数据库。
4. 已保存知识必须校验 `knowledgeItemId + userId`，防止跨用户读取内容。
5. 编辑页未保存内容可以直接把当前标题和正文传给 `/api/ai`，但如果同时传入 `knowledgeItemId`，仍要校验该知识归属。

## 3. 推荐文件结构

V0.3 建议新增或修改以下文件。后续开发时应尽量保持这些文件职责单一。

```txt
src/
  app/
    api/
      ai/
        route.ts
    app/
      items/
        [id]/
          actions.ts
          knowledge-item-editor.tsx
          page.tsx
        new/
          knowledge-form.tsx
  components/
    ai/
      ai-assistant-panel.tsx
      ai-result-preview.tsx
      ai-tag-suggestions.tsx
    knowledge/
      knowledge-list-item-view-model.ts
      knowledge-list-item-view-model.test.mjs
  lib/
    ai/
      actions.ts
      config.ts
      deepseek.ts
      errors.ts
      prompts.ts
      provider.ts
      schemas.ts
      usage-limits.ts
      *.test.mjs
    db/
      ai-usage-logs.ts
      ai-usage-logs.test.mjs
      knowledge-items.ts
      knowledge-items.test.mjs
      schema.ts
  types/
    ai.ts
    knowledge.ts
db/
  migrations/
    0003_ai_assistant.sql
.env.example
package.json
package-lock.json
```

说明：

- `src/lib/ai/*` 只放 AI 领域逻辑，不放 React 组件。
- `src/components/ai/*` 只处理交互、预览和前端状态。
- `src/lib/db/ai-usage-logs.ts` 只处理 AI 使用日志和限流查询。
- `src/app/api/ai/route.ts` 负责连接认证、权限、限流、Provider 和日志。
- `src/app/app/items/[id]/actions.ts` 继续承载已保存知识的应用动作。

## 4. 环境变量

本地 `.env.local` 与 Vercel 环境变量应配置：

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
AI_MODEL_FAST=deepseek-v4-flash
AI_MODEL_DEFAULT=deepseek-v4-flash
AI_MODEL_QUALITY=deepseek-v4-pro
AI_DAILY_LIMIT=20
AI_MAX_INPUT_CHARS=8000
AI_MIN_INPUT_CHARS=20
```

`.env.example` 后续应补充同名变量，但不写真实密钥。

禁止新增：

```env
NEXT_PUBLIC_DEEPSEEK_API_KEY=never_set_this
```

`NEXT_PUBLIC_` 变量会进入前端包，不能用于模型密钥。

## 5. AI 类型与 Action

建议新增 `src/types/ai.ts`：

```ts
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
  | { action: "generate_summary"; summary: string }
  | { action: "suggest_tags"; tags: string[] }
  | { action: "suggest_category"; category: string; categoryId: string | null; reason: string }
  | { action: "improve_title"; title: string }
  | { action: "organize_content"; content: string };
```

`suggest_category` 的服务端返回建议同时包含：

- `category`：模型推荐的分类名。
- `categoryId`：服务端在当前用户已有分类中匹配到的分类 ID；未匹配时返回 `null`。
- `reason`：推荐原因。

这样前端应用分类时不用信任模型返回的任意 ID。

## 6. AI Provider 设计

### 6.1 Provider 接口

`src/lib/ai/provider.ts` 定义统一接口：

```ts
export type AIProviderGenerateParams = {
  action: AIAction;
  title: string;
  content: string;
  existingTags: string[];
  existingCategories: string[];
  model: string;
};

export interface AIProvider {
  generate(params: AIProviderGenerateParams): Promise<unknown>;
}
```

### 6.2 DeepSeek Provider

`src/lib/ai/deepseek.ts` 使用 OpenAI-compatible SDK 调用 DeepSeek。

关键要求：

- `apiKey` 读取 `process.env.DEEPSEEK_API_KEY`。
- `baseURL` 读取 `process.env.DEEPSEEK_BASE_URL`，默认 `https://api.deepseek.com`。
- `model` 从 `AI_MODEL_FAST`、`AI_MODEL_DEFAULT`、`AI_MODEL_QUALITY` 映射得到。
- `response_format` 使用 `{ type: "json_object" }`。
- `stream` 默认为 `false`。
- Thinking 默认关闭；如果 SDK 类型不直接支持 DeepSeek 的 `thinking` 参数，优先在 DeepSeek Provider 内集中处理类型兼容，不向上层泄漏。

示意：

```ts
const completion = await client.chat.completions.create({
  model,
  messages,
  response_format: { type: "json_object" },
  stream: false,
});
```

### 6.3 模型选择策略

```txt
generate_summary  -> AI_MODEL_DEFAULT
suggest_tags      -> AI_MODEL_FAST
suggest_category  -> AI_MODEL_FAST
improve_title     -> AI_MODEL_FAST
organize_content  -> AI_MODEL_DEFAULT
```

V0.3 不在 UI 暴露模型选择。后续 V0.3.1 可以为正文整理增加“高质量整理”入口，再映射到 `AI_MODEL_QUALITY`。

## 7. Prompt 与 JSON Schema

`src/lib/ai/prompts.ts` 负责按 action 构造 system/user prompt。Prompt 必须包含：

- 输出语言跟随用户内容。
- 不编造原文没有的信息。
- 不输出解释性正文。
- 必须返回 JSON。
- 标签 3 到 5 个，优先复用已有标签。
- 分类只能从已有分类中选择；没有合适分类时返回“其他”。
- 正文整理保持事实不变，输出 Markdown 字符串。

`src/lib/ai/schemas.ts` 负责运行时校验模型输出。不要只依赖 TypeScript 类型，因为模型返回是外部输入。

每个 action 的最小校验规则：

| Action | 必需字段 | 规则 |
|---|---|---|
| `generate_summary` | `summary` | 非空字符串，建议 80 到 150 字 |
| `suggest_tags` | `tags` | 3 到 5 个非空字符串，去重后返回 |
| `suggest_category` | `category`, `reason` | `category` 必须非空，服务端再匹配已有分类 |
| `improve_title` | `title` | 非空字符串，不超过 30 个中文字符的目标约束 |
| `organize_content` | `content` | 非空字符串，应包含 Markdown 结构 |

如果 JSON 解析失败或结构不合法，统一返回格式异常错误，不能应用任何结果。

## 8. `/api/ai` 设计

### 8.1 请求

```http
POST /api/ai
Content-Type: application/json
```

```json
{
  "action": "generate_summary",
  "knowledgeItemId": "uuid",
  "title": "当前标题",
  "content": "当前正文"
}
```

字段规则：

- `action` 必填。
- `knowledgeItemId` 可选。
- `title` 可选。
- `content` 可选。
- 当 `knowledgeItemId` 存在时，服务端必须用 `getKnowledgeItemById(user.id, knowledgeItemId)` 校验归属。
- 当 `content` 存在时，优先使用请求中的 `content`；否则使用已保存知识的 `content`。
- 当 `title` 存在时，优先使用请求中的 `title`；否则使用已保存知识的 `title`。

### 8.2 响应

成功：

```json
{
  "ok": true,
  "result": {
    "action": "generate_summary",
    "summary": "AI 生成的摘要"
  }
}
```

失败：

```json
{
  "ok": false,
  "error": {
    "code": "content_too_short",
    "message": "内容过短，无法生成。"
  }
}
```

### 8.3 状态码

| 场景 | HTTP 状态码 | code |
|---|---:|---|
| 未登录 | 401 | `unauthorized` |
| 无权访问知识 | 403 | `forbidden` |
| 请求 JSON 无效 | 400 | `invalid_request` |
| action 无效 | 400 | `invalid_action` |
| 内容为空 | 400 | `content_empty` |
| 内容过短 | 400 | `content_too_short` |
| 内容过长 | 400 | `content_too_long` |
| 达到每日限制 | 429 | `daily_limit_exceeded` |
| Provider 未配置 | 500 | `provider_not_configured` |
| DeepSeek 请求失败 | 502 | `provider_failed` |
| DeepSeek 返回空内容 | 502 | `empty_provider_response` |
| JSON 解析失败 | 502 | `invalid_provider_response` |

## 9. 权限与限流流程

`POST /api/ai` 执行顺序：

1. 调用 `requireUser()` 获取当前用户。
2. 解析 JSON body。
3. 校验 `action`。
4. 如果有 `knowledgeItemId`，查询当前用户的知识；查不到返回 403。
5. 解析最终 `title/content`。
6. 校验内容为空、过短、过长。
7. 查询当前用户当天 AI 使用次数。
8. 达到限制则返回 429。
9. 读取 AI 配置。
10. 按 action 读取当前用户已有标签或分类。
11. 调用 DeepSeek Provider。
12. 解析并校验 JSON。
13. 写入 `ai_usage_logs` 成功记录。
14. 返回候选结果。

Provider 调用失败时仍要写入失败日志，但不记录完整正文。

每日限制建议按 UTC 自然日计算，便于数据库查询稳定：

```sql
created_at >= date_trunc('day', now() at time zone 'utc')
```

如果后续需要按用户本地时区计算，可以在设置页引入用户时区后调整。

## 10. 数据库设计

### 10.1 `knowledge_items` 新增字段

V0.3 建议在 `db/migrations/0003_ai_assistant.sql` 中新增：

```sql
alter table public.knowledge_items
  add column if not exists summary text,
  add column if not exists summary_generated_at timestamptz,
  add column if not exists ai_updated_at timestamptz;
```

Drizzle schema 同步增加：

```ts
summary: text("summary"),
summary_generated_at: timestamp("summary_generated_at", {
  mode: "string",
  withTimezone: true,
}),
ai_updated_at: timestamp("ai_updated_at", {
  mode: "string",
  withTimezone: true,
}),
```

`src/types/knowledge.ts` 中 `KnowledgeItem` 同步增加：

```ts
summary: string | null;
summary_generated_at: string | null;
ai_updated_at: string | null;
```

### 10.2 `ai_usage_logs` 新表

```sql
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  knowledge_item_id uuid,
  action_type text not null,
  model text not null,
  status text not null,
  input_length integer not null default 0,
  output_length integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),

  constraint ai_usage_logs_status_check
    check (status in ('success', 'failed')),
  constraint ai_usage_logs_action_type_check
    check (action_type in (
      'generate_summary',
      'suggest_tags',
      'suggest_category',
      'improve_title',
      'organize_content'
    )),
  constraint ai_usage_logs_item_user_fk
    foreign key (knowledge_item_id, user_id)
    references public.knowledge_items(id, user_id)
    on delete set null
);

create index if not exists ai_usage_logs_user_created_idx
on public.ai_usage_logs (user_id, created_at desc);

create index if not exists ai_usage_logs_user_action_created_idx
on public.ai_usage_logs (user_id, action_type, created_at desc);
```

说明：

- `knowledge_item_id` 允许为空，用于编辑页未保存内容的 AI 请求。
- `error_message` 只保存错误摘要，不保存用户正文。
- `input_length` 和 `output_length` 保存字符长度，用于粗略成本观察。

### 10.3 RLS

```sql
alter table public.ai_usage_logs enable row level security;

create policy "ai_usage_logs_select_own"
on public.ai_usage_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "ai_usage_logs_insert_own"
on public.ai_usage_logs
for insert
to authenticated
with check (auth.uid() = user_id);
```

V0.3 不开放 `update` 和 `delete` policy。

## 11. 应用 AI 结果

### 11.1 生成与应用分离

`/api/ai` 只做生成。应用结果分两类：

1. 编辑页：AI 候选结果先写入本地 React 状态；用户再点击现有“保存”按钮，走现有 `updateKnowledgeItemAction()`。
2. 详情页：没有编辑表单时，通过新增 Server Action 显式应用到已保存知识。

### 11.2 已保存知识的应用动作

建议在 `src/app/app/items/[id]/actions.ts` 增加窄口径 Server Actions：

- `applyKnowledgeItemSummaryAction(itemId, summary)`
- `applyKnowledgeItemCategoryAction(itemId, categoryId)`
- `applyKnowledgeItemTagsAction(itemId, selectedTagNames)`
- `applyKnowledgeItemTitleAction(itemId, title)`
- `appendKnowledgeItemOrganizedContentAction(itemId, content)`
- `replaceKnowledgeItemContentAction(itemId, content)`

也可以合并为一个 `applyKnowledgeItemAiResultAction`，但必须在内部按 action 做严格字段白名单，避免客户端提交任意字段。

推荐策略：

- 摘要：更新 `summary`、`summary_generated_at`、`ai_updated_at`。
- 标签：读取现有标签，合并用户勾选标签，调用 `updateItemTags()`。
- 分类：只接受当前用户已有分类 ID；不自动创建分类。
- 标题：更新 `title` 与 `ai_updated_at`。
- 正文追加：在原正文后追加分隔标题和整理结果。
- 正文替换：前端二次确认后更新 `content` 与 `ai_updated_at`。

## 12. 前端交互设计

### 12.1 共享 AI 助手组件

新增 `src/components/ai/ai-assistant-panel.tsx`：

- 渲染五个操作按钮。
- 控制 `idle/loading/success/error/applying/applied` 状态。
- 调用 `/api/ai`。
- 展示 `AIResultPreview`。
- 不直接读取密钥或调用模型。

建议 props：

```ts
type AIAssistantPanelProps = {
  itemId?: string;
  title: string;
  content: string;
  categories: Category[];
  currentTagNames: string[];
  onApplySummary?: (summary: string) => void;
  onApplyTags?: (tagNames: string[]) => void;
  onApplyCategory?: (categoryId: string | null) => void;
  onApplyTitle?: (title: string) => void;
  onAppendContent?: (content: string) => void;
  onReplaceContent?: (content: string) => void;
};
```

### 12.2 编辑页

在 `knowledge-item-editor.tsx` 中：

- 标题 input 从 uncontrolled 改为受控状态，便于“优化标题”直接预览并应用到表单。
- 正文已有 `content` state，可直接复用。
- 标签已有 `tagNames` state，可直接复用。
- 分类 select 需要引入 `categoryId` state，便于“推荐分类”应用到表单。
- AI 应用只改变本地表单状态；保存仍由现有 `updateKnowledgeItemAction()` 完成。

在 `knowledge-form.tsx` 中：

- 新建知识页可以复用 AI 助手处理未保存内容。
- 因为没有 `knowledgeItemId`，`/api/ai` 不做知识归属校验，但仍做登录、输入长度、限流和日志。

### 12.3 详情页

在 `page.tsx` 中：

- 展示 `item.summary`，没有摘要时展示“暂无 AI 摘要”状态。
- 提供生成摘要、推荐标签、推荐分类、整理正文入口。
- 用户确认应用后调用对应 Server Action。
- 标题优化可以放在详情页，但主要入口仍建议在编辑页，减少直接覆盖标题的误操作。

### 12.4 列表页

`buildKnowledgeListItemViewModel()` 的摘要优先级改为：

```txt
item.summary -> content 截断 -> 暂无正文内容
```

需要补充单元测试覆盖：

- 有 `summary` 时展示 summary。
- 无 `summary` 时保持现有正文截断逻辑。

## 13. 错误处理与用户提示

前端提示应尽量使用用户可操作的文案：

| code | 文案 |
|---|---|
| `content_empty` | 请先输入正文内容。 |
| `content_too_short` | 内容过短，无法生成。 |
| `content_too_long` | 内容过长，请缩短后重试。 |
| `daily_limit_exceeded` | 今日 AI 使用次数已达上限。 |
| `provider_failed` | AI 生成失败，请稍后重试。 |
| `invalid_provider_response` | AI 返回格式异常，请重新生成。 |
| `unauthorized` | 请先登录后再继续操作。 |
| `forbidden` | 没有找到这条知识，或你没有访问权限。 |

服务端错误日志不能打印完整正文。可记录：

- `userId`
- `knowledgeItemId`
- `action`
- `model`
- `inputLength`
- `errorCode`
- `providerStatus`

## 14. 测试策略

V0.3 沿用当前仓库的轻量 Node 测试风格，优先测试纯函数和关键边界。

建议新增测试：

```txt
src/lib/ai/config.test.mjs
src/lib/ai/prompts.test.mjs
src/lib/ai/schemas.test.mjs
src/lib/ai/errors.test.mjs
src/lib/ai/usage-limits.test.mjs
src/lib/db/ai-usage-logs.test.mjs
src/components/knowledge/knowledge-list-item-view-model.test.mjs
src/components/ai/ai-result-preview.test.mjs
```

建议验证命令：

```bash
npm run lint
npm run build
npm run test:knowledge-items
npm run test:tags
npm run test:categories
npm run test:knowledge-item-draft
npm run test:knowledge-list-item
```

后续如果新增 AI 测试脚本，建议在 `package.json` 增加：

```json
{
  "scripts": {
    "test:ai": "node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/schemas.test.mjs"
  }
}
```

真实 DeepSeek 调用不应成为默认 CI 测试。Provider 测试应 mock OpenAI-compatible client，线上验证再单独执行一次手动调用。

## 15. 部署与验收

部署前检查：

- `openai` 依赖已安装。
- `.env.example` 包含 AI 变量但无真实密钥。
- Vercel 已配置所有 AI 环境变量。
- 数据库 migration 已在目标环境执行。
- `DEEPSEEK_API_KEY` 没有出现在前端源码、浏览器 Network 响应或构建产物中。
- 未登录用户访问 `/api/ai` 返回 401。
- 用户无法通过他人 `knowledgeItemId` 调用 AI。
- AI 结果未确认时不会修改数据库。
- DeepSeek 失败不会修改标题、正文、标签、分类或摘要。
- 每日使用限制生效。
- AI 使用日志只包含元信息，不包含完整正文。

V0.3 完成标准：

1. DeepSeek API 服务端调用成功。
2. `/api/ai` 支持五个 V0.3 action。
3. 摘要、标签、分类、标题和正文整理都有预览和确认应用流程。
4. 列表页优先展示 AI 摘要。
5. `ai_usage_logs` 可记录成功和失败请求。
6. RLS 与 repository 级 `userId` 过滤保持有效。
7. V0.1/V0.2 现有 CRUD、搜索、标签、分类、列表和详情能力不回退。
