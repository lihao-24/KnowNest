# KnowNest V0.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 接入 DeepSeek API，并为 KnowNest 增加 AI 摘要、标签推荐、分类推荐、标题优化和正文整理能力。

**Architecture:** 使用统一服务端 `/api/ai` 调用 DeepSeek，AI 结果只作为候选结果返回；用户在前端预览并确认后，再通过现有 Server Action 和 repository 写入自己的知识数据。Provider、Prompt、Schema、错误处理、日志与限流集中在 `src/lib/ai/*` 和 `src/lib/db/ai-usage-logs.ts`。

**Tech Stack:** Next.js App Router、React 19、TypeScript、Drizzle ORM、PostgreSQL、Supabase Auth/RLS、OpenAI-compatible DeepSeek API。

---

## 0. 执行原则

- 不把 `DEEPSEEK_API_KEY` 放入任何 `NEXT_PUBLIC_` 变量。
- 不让前端直接调用 DeepSeek。
- `/api/ai` 不直接覆盖知识内容。
- 所有应用动作都必须校验当前用户和知识归属。
- AI 日志只记录元信息，不记录完整正文。
- 每个任务完成后运行对应最小测试，再进入下一个任务。
- 数据库 migration 文件可以提交，但执行 migration 需要单独确认环境。

## 1. 阶段拆分

| 阶段 | 目标 | 主要交付 |
|---|---|---|
| Phase 1 | 数据结构与类型准备 | migration、Drizzle schema、TS 类型 |
| Phase 2 | AI 基础设施 | config、provider、prompts、schemas、errors |
| Phase 3 | AI API 与日志限流 | `/api/ai`、`ai_usage_logs` repository、限流 |
| Phase 4 | 摘要闭环 | 生成摘要、应用摘要、详情和列表展示 |
| Phase 5 | 标签和分类闭环 | 推荐标签、推荐分类、用户确认应用 |
| Phase 6 | 标题和正文整理闭环 | 优化标题、整理正文、追加/替换 |
| Phase 7 | 验证与部署准备 | 单元测试、构建、Vercel 配置检查 |

## Task 1: 数据库 migration 与类型同步

**Files:**

- Create: `db/migrations/0003_ai_assistant.sql`
- Modify: `src/lib/db/schema.ts`
- Modify: `src/types/knowledge.ts`
- Modify: `src/lib/db/knowledge-items.ts`
- Test: `src/lib/db/knowledge-items.test.mjs`

- [ ] **Step 1: 新增 migration 文件**

在 `db/migrations/0003_ai_assistant.sql` 写入：

```sql
alter table public.knowledge_items
  add column if not exists summary text,
  add column if not exists summary_generated_at timestamptz,
  add column if not exists ai_updated_at timestamptz;

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

- [ ] **Step 2: 同步 Drizzle schema**

在 `src/lib/db/schema.ts` 中增加 `integer` import，并给 `knowledgeItems` 增加：

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

新增 `aiUsageLogs` 表定义，字段与 migration 保持一致。

- [ ] **Step 3: 同步 KnowledgeItem 类型**

在 `src/types/knowledge.ts` 的 `KnowledgeItem` 增加：

```ts
summary: string | null;
summary_generated_at: string | null;
ai_updated_at: string | null;
```

- [ ] **Step 4: 扩展更新输入白名单**

在 `src/lib/db/knowledge-items.ts` 的 `UpdateKnowledgeItemInput`、`UpdateKnowledgeItemValues`、`normalizeUpdateKnowledgeItemInput()` 中允许：

```ts
"summary" | "summary_generated_at" | "ai_updated_at"
```

并只在字段不是 `undefined` 时写入。

- [ ] **Step 5: 更新 schema 测试**

在 `src/lib/db/knowledge-items.test.mjs` 增加断言：

```js
assert.ok(schema.knowledgeItems.summary);
assert.ok(schema.knowledgeItems.summary_generated_at);
assert.ok(schema.knowledgeItems.ai_updated_at);
assert.ok(schema.aiUsageLogs);
```

并增加 `normalizeUpdateKnowledgeItemInput()` 可更新摘要字段的断言。

- [ ] **Step 6: 运行验证**

Run:

```bash
npm run test:knowledge-items
```

Expected: PASS。

## Task 2: AI 类型、配置、错误和 Schema

**Files:**

- Create: `src/types/ai.ts`
- Create: `src/lib/ai/config.ts`
- Create: `src/lib/ai/errors.ts`
- Create: `src/lib/ai/schemas.ts`
- Create: `src/lib/ai/config.test.mjs`
- Create: `src/lib/ai/errors.test.mjs`
- Create: `src/lib/ai/schemas.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: 新增 AI 类型**

创建 `src/types/ai.ts`，包含：

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
```

- [ ] **Step 2: 实现配置读取**

创建 `src/lib/ai/config.ts`，导出：

```ts
export type AIConfig = {
  provider: "deepseek";
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  modelFast: string;
  modelDefault: string;
  modelQuality: string;
  dailyLimit: number;
  maxInputChars: number;
  minInputChars: number;
};

export function readAIConfig(env = process.env): AIConfig;
export function getModelForAction(action: AIAction, config: AIConfig): string;
```

默认值：

```txt
AI_PROVIDER=deepseek
DEEPSEEK_BASE_URL=https://api.deepseek.com
AI_MODEL_FAST=deepseek-v4-flash
AI_MODEL_DEFAULT=deepseek-v4-flash
AI_MODEL_QUALITY=deepseek-v4-pro
AI_DAILY_LIMIT=20
AI_MAX_INPUT_CHARS=8000
AI_MIN_INPUT_CHARS=20
```

缺少 `DEEPSEEK_API_KEY` 时抛出配置错误。

- [ ] **Step 3: 实现错误映射**

创建 `src/lib/ai/errors.ts`，导出：

```ts
export class AIRequestError extends Error {
  constructor(
    public code: AIErrorCode,
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function toAIErrorResponse(error: unknown): {
  status: number;
  body: { ok: false; error: { code: AIErrorCode; message: string } };
};
```

- [ ] **Step 4: 实现模型输出 Schema 校验**

创建 `src/lib/ai/schemas.ts`，导出：

```ts
export function parseAIJson(content: string): unknown;
export function validateAIResult(action: AIAction, value: unknown): AIGenerateResult;
```

校验要求：

- `summary/title/content/category/reason` 都必须是 trim 后非空字符串。
- `tags` 必须是数组，trim、过滤空值、去重后返回 3 到 5 个。
- `improve_title` 的 title 超过 30 个字符时截断或返回格式异常；优先返回格式异常，避免悄悄修改模型输出。

- [ ] **Step 5: 增加测试脚本**

在 `package.json` 增加：

```json
"test:ai": "node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/ai/schemas.test.mjs"
```

如果测试拆成多个文件，可以让 `test:ai` 运行 `src/lib/ai/*.test.mjs` 中的聚合入口。

- [ ] **Step 6: 运行验证**

Run:

```bash
npm run test:ai
```

Expected: PASS。

## Task 3: Prompt 与 DeepSeek Provider

**Files:**

- Create: `src/lib/ai/provider.ts`
- Create: `src/lib/ai/prompts.ts`
- Create: `src/lib/ai/deepseek.ts`
- Create: `src/lib/ai/prompts.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: 安装 OpenAI SDK**

Run:

```bash
npm install openai --save --no-fund --no-audit
```

Expected: `package.json` 和 `package-lock.json` 增加 `openai`。

- [ ] **Step 2: 定义 Provider 接口**

创建 `src/lib/ai/provider.ts`：

```ts
import type { AIAction } from "@/types/ai";

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

- [ ] **Step 3: 实现 Prompt 构造**

创建 `src/lib/ai/prompts.ts`，导出：

```ts
export function buildAIMessages(params: AIProviderGenerateParams): Array<{
  role: "system" | "user";
  content: string;
}>;
```

所有 action 的 system prompt 都包含：

```txt
你是 KnowNest 的 AI 知识整理助手。你只能根据用户提供的标题、正文、标签和分类进行整理，不要编造原文没有的信息。必须返回 JSON，不要输出 Markdown 代码围栏，不要输出解释。
```

- [ ] **Step 4: 实现 DeepSeek Provider**

创建 `src/lib/ai/deepseek.ts`：

```ts
import "server-only";
import OpenAI from "openai";

export function createDeepSeekProvider(config: AIConfig): AIProvider;
```

调用参数：

```ts
{
  model: params.model,
  messages: buildAIMessages(params),
  response_format: { type: "json_object" },
  stream: false,
}
```

返回 `completion.choices[0]?.message?.content` 解析后的原始 JSON 对象。

- [ ] **Step 5: 测试 Prompt**

`src/lib/ai/prompts.test.mjs` 至少断言：

- 每个 action 都要求 JSON。
- 标签 Prompt 包含已有标签。
- 分类 Prompt 包含已有分类。
- 正文整理 Prompt 要求 Markdown 结构并保持原意。

- [ ] **Step 6: 运行验证**

Run:

```bash
npm run test:ai
npm run build
```

Expected: PASS。

## Task 4: AI 使用日志与限流

**Files:**

- Create: `src/lib/db/ai-usage-logs.ts`
- Create: `src/lib/db/ai-usage-logs.test.mjs`
- Create: `src/lib/ai/usage-limits.ts`
- Create: `src/lib/ai/usage-limits.test.mjs`
- Modify: `src/lib/db/schema.ts`
- Modify: `package.json`

- [ ] **Step 1: 实现日志 repository**

`src/lib/db/ai-usage-logs.ts` 导出：

```ts
export type CreateAIUsageLogInput = {
  userId: string;
  knowledgeItemId?: string | null;
  actionType: AIAction;
  model: string;
  status: "success" | "failed";
  inputLength: number;
  outputLength: number;
  errorMessage?: string | null;
};

export async function createAIUsageLog(input: CreateAIUsageLogInput): Promise<void>;
export async function countTodayAIUsage(userId: string): Promise<number>;
```

`countTodayAIUsage()` 按 UTC 自然日查询当前用户当天日志数。

- [ ] **Step 2: 实现限流判断**

`src/lib/ai/usage-limits.ts` 导出：

```ts
export function assertAIUsageAllowed(currentCount: number, dailyLimit: number): void;
export function validateAIInputLength(content: string, min: number, max: number): void;
```

错误使用 `AIRequestError`。

- [ ] **Step 3: 测试限流和长度**

覆盖：

- `currentCount < dailyLimit` 允许。
- `currentCount >= dailyLimit` 返回 `daily_limit_exceeded`。
- 空正文返回 `content_empty`。
- 短正文返回 `content_too_short`。
- 长正文返回 `content_too_long`。

- [ ] **Step 4: 增加测试脚本覆盖**

更新 `test:ai`，让它运行 schema、errors、config、prompts、usage-limits 测试。

- [ ] **Step 5: 运行验证**

Run:

```bash
npm run test:ai
```

Expected: PASS。

## Task 5: 统一 `/api/ai` 路由

**Files:**

- Create: `src/app/api/ai/route.ts`
- Create: `src/lib/ai/actions.ts`
- Create: `src/lib/ai/actions.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: 实现请求解析**

`src/lib/ai/actions.ts` 导出：

```ts
export function parseAIGenerateRequest(value: unknown): AIGenerateRequest;
export async function buildAIGenerateContext(userId: string, request: AIGenerateRequest): Promise<{
  action: AIAction;
  knowledgeItemId: string | null;
  title: string;
  content: string;
  existingTags: string[];
  existingCategories: string[];
}>;
```

当 `knowledgeItemId` 存在但 `getKnowledgeItemById(userId, id)` 返回空时，抛出 `forbidden`。

- [ ] **Step 2: 实现路由处理**

`src/app/api/ai/route.ts`：

```ts
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const config = readAIConfig();
    const body = await request.json();
    const aiRequest = parseAIGenerateRequest(body);
    const context = await buildAIGenerateContext(user.id, aiRequest);
    validateAIInputLength(context.content, config.minInputChars, config.maxInputChars);
    assertAIUsageAllowed(await countTodayAIUsage(user.id), config.dailyLimit);
    const model = getModelForAction(context.action, config);
    const provider = createDeepSeekProvider(config);
    const result = await provider.generate({ ...context, model });
    const validated = validateAIResult(context.action, result);
    await createAIUsageLog({
      userId: user.id,
      knowledgeItemId: context.knowledgeItemId,
      actionType: context.action,
      model,
      status: "success",
      inputLength: context.content.length,
      outputLength: JSON.stringify(validated).length,
      errorMessage: null,
    });
    return Response.json({ ok: true, result: validated });
  } catch (error) {
    const response = toAIErrorResponse(error);
    return Response.json(response.body, { status: response.status });
  }
}
```

- [ ] **Step 3: 失败日志不泄露正文**

失败日志只写：

```ts
{
  userId,
  knowledgeItemId,
  actionType,
  model,
  status: "failed",
  inputLength,
  outputLength: 0,
  errorMessage: safeErrorMessage,
}
```

`safeErrorMessage` 最长 300 字符。

- [ ] **Step 4: 测试请求解析**

`src/lib/ai/actions.test.mjs` 覆盖：

- action 无效报错。
- 未提供内容且无 `knowledgeItemId` 报错。
- 传入 `knowledgeItemId` 时会保留 ID。
- 请求中 content 优先级高于已保存 content 的规则在纯函数或 mock 中覆盖。

- [ ] **Step 5: 运行验证**

Run:

```bash
npm run test:ai
npm run build
```

Expected: PASS。

## Task 6: AI 摘要应用与展示

**Files:**

- Modify: `src/app/app/items/[id]/actions.ts`
- Modify: `src/app/app/items/[id]/page.tsx`
- Modify: `src/components/knowledge/knowledge-list-item-view-model.ts`
- Modify: `src/components/knowledge/knowledge-list-item-view-model.test.mjs`
- Create: `src/components/ai/ai-assistant-panel.tsx`
- Create: `src/components/ai/ai-result-preview.tsx`

- [ ] **Step 1: 增加摘要应用 Server Action**

在 `src/app/app/items/[id]/actions.ts` 新增：

```ts
export async function applyKnowledgeItemSummaryAction(
  itemId: string,
  summary: string,
): Promise<{ errorMessage: string; successMessage: string }>;
```

内部逻辑：

- `requireUser()`。
- trim summary，空值返回错误。
- `updateKnowledgeItem(user.id, itemId, { summary, summary_generated_at: now, ai_updated_at: now })`。
- 未找到返回“没有找到这条知识，或你没有访问权限。”。
- 成功后 revalidate `/app`、`/app/items/${itemId}`、`/app/inbox`、`/app/favorites`、`/app/archive`。

- [ ] **Step 2: 列表摘要优先展示**

修改 `buildKnowledgeListItemViewModel()`：

```txt
summary = item.summary trimmed if present, otherwise content snippet
```

测试增加：

```js
const summaryViewModel = buildKnowledgeListItemViewModel({
  ...item,
  summary: "AI 摘要内容",
});
assert.equal(summaryViewModel.summary, "AI 摘要内容");
```

- [ ] **Step 3: 详情页展示摘要**

在 `src/app/app/items/[id]/page.tsx` 的正文前展示摘要区域：

```txt
AI 摘要
有 summary：展示 summary 和生成时间
无 summary：展示“暂无 AI 摘要”
```

- [ ] **Step 4: 创建 AI 助手基础组件**

`src/components/ai/ai-assistant-panel.tsx` 支持至少 `generate_summary`：

- 点击按钮调用 `/api/ai`。
- loading 时禁用按钮。
- 成功后显示预览。
- 用户点击应用后调用 `onApplySummary(summary)`。
- 取消时清空预览。

- [ ] **Step 5: 运行验证**

Run:

```bash
npm run test:knowledge-list-item
npm run build
```

Expected: PASS。

## Task 7: 编辑页 AI 助手接入

**Files:**

- Modify: `src/app/app/items/[id]/knowledge-item-editor.tsx`
- Modify: `src/app/app/items/new/knowledge-form.tsx`
- Modify: `src/components/ai/ai-assistant-panel.tsx`
- Modify: `src/components/ai/ai-result-preview.tsx`

- [ ] **Step 1: 编辑页标题改为受控状态**

在 `knowledge-item-editor.tsx` 中新增：

```ts
const [title, setTitle] = useState(item.title);
```

标题 input 使用 `value={title}` 和 `onChange={(event) => setTitle(event.target.value)}`。

- [ ] **Step 2: 编辑页分类改为受控状态**

新增：

```ts
const [categoryId, setCategoryId] = useState(item.category_id ?? "");
```

分类 select 使用 `value={categoryId}` 和 `onChange`。

- [ ] **Step 3: 插入 AI 助手**

在正文、标签、分类区域之后插入 `AIAssistantPanel`：

```tsx
<AIAssistantPanel
  itemId={item.id}
  title={title}
  content={content}
  categories={categories}
  currentTagNames={tagNames}
  onApplySummary={() => {}}
  onApplyTags={setTagNames}
  onApplyCategory={(nextCategoryId) => setCategoryId(nextCategoryId ?? "")}
  onApplyTitle={setTitle}
  onAppendContent={(nextContent) => setContent(`${content}\n\n${nextContent}`)}
  onReplaceContent={setContent}
/>
```

摘要在编辑页可以先只预览，不自动写入隐藏字段；已保存摘要由详情页应用或后续在保存 action 中扩展。

- [ ] **Step 4: 新建页接入未保存内容 AI**

在 `knowledge-form.tsx` 复用同一组件，不传 `itemId`。

应用策略：

- 推荐标签：`setTagNames`。
- 推荐分类：设置本地 `categoryId`。
- 优化标题：设置 `title`。
- 整理正文：追加或替换 `content`。
- 摘要：只预览，不写入新建表单；新建知识保存摘要可作为后续增强。

- [ ] **Step 5: 运行验证**

Run:

```bash
npm run build
```

Expected: PASS。

## Task 8: 推荐标签与分类闭环

**Files:**

- Modify: `src/components/ai/ai-assistant-panel.tsx`
- Modify: `src/components/ai/ai-result-preview.tsx`
- Create: `src/components/ai/ai-tag-suggestions.tsx`
- Modify: `src/app/app/items/[id]/actions.ts`
- Modify: `src/app/app/items/[id]/page.tsx`

- [ ] **Step 1: AI 助手支持推荐标签**

`AIAssistantPanel` 增加 `suggest_tags` 按钮。

预览要求：

- 展示 3 到 5 个标签。
- 默认全选。
- 用户可以取消部分标签。
- 点击“添加到知识”后调用 `onApplyTags(selectedTags)`。

- [ ] **Step 2: AI 助手支持推荐分类**

`suggest_category` 预览展示：

```txt
推荐分类：分类名
推荐原因：reason
```

如果 `categoryId` 为 `null`，应用按钮禁用并提示没有匹配到已有分类。

- [ ] **Step 3: 详情页标签应用 action**

在 `actions.ts` 新增：

```ts
export async function applyKnowledgeItemTagsAction(
  itemId: string,
  selectedTagNames: string[],
): Promise<{ errorMessage: string; successMessage: string }>;
```

内部：

- 校验用户和知识归属。
- 读取当前标签。
- 合并当前标签和 selectedTagNames。
- 调用 `updateItemTags(user.id, itemId, mergedTagNames)`。

- [ ] **Step 4: 详情页分类应用 action**

在 `actions.ts` 新增：

```ts
export async function applyKnowledgeItemCategoryAction(
  itemId: string,
  categoryId: string,
): Promise<{ errorMessage: string; successMessage: string }>;
```

内部：

- `getCategoryById(user.id, categoryId)` 必须存在。
- 调用 `updateKnowledgeItem(user.id, itemId, { category_id: categoryId, ai_updated_at: now })`。

- [ ] **Step 5: 运行验证**

Run:

```bash
npm run test:tags
npm run test:categories
npm run build
```

Expected: PASS。

## Task 9: 优化标题与整理正文闭环

**Files:**

- Modify: `src/components/ai/ai-assistant-panel.tsx`
- Modify: `src/components/ai/ai-result-preview.tsx`
- Modify: `src/app/app/items/[id]/actions.ts`
- Modify: `src/app/app/items/[id]/page.tsx`
- Modify: `src/app/app/items/[id]/knowledge-item-editor.tsx`
- Modify: `src/app/app/items/new/knowledge-form.tsx`

- [ ] **Step 1: 支持优化标题**

AI 预览展示推荐标题，用户确认后：

- 编辑页：调用 `setTitle`，不立即保存。
- 详情页：调用 `applyKnowledgeItemTitleAction(itemId, title)`。

Server Action 内部必须 trim title，并拒绝空标题。

- [ ] **Step 2: 支持整理正文**

AI 预览展示 Markdown 内容，提供：

```txt
追加到正文
替换正文
取消
```

替换正文时前端增加二次确认状态。

- [ ] **Step 3: 详情页追加正文 action**

在 `actions.ts` 新增：

```ts
export async function appendKnowledgeItemOrganizedContentAction(
  itemId: string,
  content: string,
): Promise<{ errorMessage: string; successMessage: string }>;
```

追加格式：

```md

---

## AI 整理结果

{content}
```

- [ ] **Step 4: 详情页替换正文 action**

在 `actions.ts` 新增：

```ts
export async function replaceKnowledgeItemContentAction(
  itemId: string,
  content: string,
): Promise<{ errorMessage: string; successMessage: string }>;
```

服务端只负责权限和非空校验，二次确认由前端负责。

- [ ] **Step 5: 运行验证**

Run:

```bash
npm run test:knowledge-item-draft
npm run build
```

Expected: PASS。

## Task 10: 环境变量、依赖和部署检查

**Files:**

- Modify: `.env.example`
- Modify: `docs/operations/vercel-deployment.md`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: 更新 `.env.example`**

追加：

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
AI_MODEL_FAST=deepseek-v4-flash
AI_MODEL_DEFAULT=deepseek-v4-flash
AI_MODEL_QUALITY=deepseek-v4-pro
AI_DAILY_LIMIT=20
AI_MAX_INPUT_CHARS=8000
AI_MIN_INPUT_CHARS=20
```

- [ ] **Step 2: 确认依赖**

确认：

```txt
package.json dependencies contains openai
package-lock.json contains openai resolved package
```

- [ ] **Step 3: Vercel 配置检查**

上线前在 Vercel 配置以下变量：

```txt
AI_PROVIDER
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
AI_MODEL_FAST
AI_MODEL_DEFAULT
AI_MODEL_QUALITY
AI_DAILY_LIMIT
AI_MAX_INPUT_CHARS
AI_MIN_INPUT_CHARS
```

不要配置 `NEXT_PUBLIC_DEEPSEEK_API_KEY`。

- [ ] **Step 4: 运行全量本地验证**

Run:

```bash
npm run lint
npm run test:ai
npm run test:knowledge-items
npm run test:tags
npm run test:categories
npm run test:knowledge-item-draft
npm run test:knowledge-list-item
npm run build
```

Expected: 全部 PASS。

## Task 11: 手动验收清单

**Files:**

- No required source files

- [ ] **Step 1: 认证与权限**

验证：

- 未登录调用 `/api/ai` 返回 401。
- 登录用户对自己的知识调用成功。
- 登录用户传入他人的 `knowledgeItemId` 返回 403。

- [ ] **Step 2: 输入边界**

验证：

- 空正文返回“请先输入正文内容。”
- 过短正文返回“内容过短，无法生成。”
- 超过 `AI_MAX_INPUT_CHARS` 返回“内容过长，请缩短后重试。”

- [ ] **Step 3: 五个 AI action**

验证：

- `generate_summary` 返回摘要并可预览。
- `suggest_tags` 返回 3 到 5 个标签并可选择应用。
- `suggest_category` 从已有分类推荐并展示原因。
- `improve_title` 返回标题并可应用。
- `organize_content` 返回 Markdown，可追加或替换。

- [ ] **Step 4: 不自动覆盖**

验证：

- AI 成功生成但未点击应用时，数据库不变化。
- 点击取消后，标题、正文、标签、分类、摘要不变化。
- DeepSeek 请求失败时，原始内容不变化。

- [ ] **Step 5: 使用日志与限流**

验证：

- 成功请求写入 `ai_usage_logs`。
- 失败的 Provider 请求写入失败日志。
- 日志不包含完整正文。
- 达到 `AI_DAILY_LIMIT` 后返回 429。

- [ ] **Step 6: 页面展示**

验证：

- 详情页展示 AI 摘要。
- 列表页优先展示 AI 摘要。
- 无 AI 摘要时，列表页保持正文截断预览。
- 移动端按钮、预览和确认区域无重叠。

## 12. 推荐提交拆分

建议按以下粒度提交，便于回滚和 review：

```txt
feat(ai): add ai schema and usage tables
feat(ai): add deepseek provider foundation
feat(ai): add unified ai route
feat(ai): add summary generation flow
feat(ai): add tag and category suggestions
feat(ai): add title and content organization
test(ai): cover ai validation and usage limits
chore(ai): update env example and deployment checklist
```

每个提交前至少运行该阶段相关测试；合并 V0.3 前运行全量验证。
