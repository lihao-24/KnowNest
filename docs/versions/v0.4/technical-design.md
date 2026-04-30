# KnowNest V0.4 Technical Design

## 1. 目标与边界

V0.4 的目标是为 KnowNest 增加“AI 类型模板化整理”能力。系统根据知识类型匹配默认模板，并将类型、分类、标签、模板结构和模板 AI 要求一起传给 AI，生成可预览、可分区应用的结构化候选结果。

本设计基于当前项目现状：

- 技术栈：Next.js App Router、React 19、TypeScript、Drizzle ORM、`pg`、Supabase Auth/RLS。
- 认证入口：`src/lib/auth/server.ts` 中的 `requireUser()`。
- 知识类型定义：`src/types/knowledge.ts` 和 `src/constants/knowledge.ts`。
- AI 入口：`src/app/api/ai/route.ts`、`src/app/api/ai/route-handler.ts`。
- AI 领域逻辑：`src/lib/ai/*`。
- AI 前端组件：`src/components/ai/*`。
- 设置页入口：`src/app/app/settings/page.tsx`、`src/app/app/settings/settings-panel.tsx`。
- 知识编辑入口：`src/app/app/items/new/knowledge-form.tsx` 与 `src/app/app/items/[id]/knowledge-item-editor.tsx`。
- 数据库迁移目录：`db/migrations/`，当前最新迁移为 `0003_ai_assistant.sql`。

V0.4 遵守以下边界：

- 不引入向量搜索、知识库问答、文件上传解析、浏览器插件或模板市场。
- 不做复杂模板变量系统、多级模板继承或标签强绑定模板。
- 不让 AI 直接写入 `knowledge_items`。
- 不让前端直接访问模型 Provider 或服务端密钥。
- 不在 AI 使用日志中保存完整正文或模板化输出全文。
- 模板数据按用户隔离，用户只能访问自己的模板。

## 2. 总体架构

V0.4 采用“用户模板库 + 类型默认模板匹配 + 现有 AI 网关扩展”的架构。

```txt
Settings / Knowledge Template UI
  |
  | Server Actions / Repository
  v
knowledge_templates

Knowledge editor
  |
  | type -> current template
  v
Template selector
  |
  | POST /api/ai action=template_organize
  v
AI route handler
  |
  | auth, ownership, template ownership, input validation, rate limit, logging
  v
src/lib/ai/prompts.ts
  |
  | OpenAI-compatible provider
  v
AI Provider

AI result
  |
  v
Before / after preview
  |
  | user applies title / summary / content / tags / category
  v
Existing save flow or narrow Server Actions
```

关键原则：

1. `knowledge_templates` 是 V0.4 的核心新增业务表。
2. 每个用户、每个知识类型最多有一个默认模板，由数据库部分唯一索引兜底。
3. 每个用户最多有一个全局默认模板，使用 `type = null` 和 `is_global_default = true` 表达。
4. 默认模板由系统初始化到用户账号下，用户可以编辑。
5. AI 生成仍统一走 `/api/ai`，并接入现有 dispatch、鉴权、限流、日志和 schema 校验层。
6. `template_organize` 返回标题、摘要、正文、标签、分类候选结果。
7. 前端只把候选结果应用到本地编辑状态或显式 Server Action，不在 AI 请求成功后自动保存。

## 3. 推荐文件结构

V0.4 建议新增或修改以下文件：

```txt
src/
  app/
    api/
      ai/
        route-handler.ts
        route.test.mjs
    app/
      items/
        [id]/
          actions.ts
          knowledge-item-editor.tsx
        new/
          knowledge-form.tsx
      settings/
        page.tsx
        settings-panel.tsx
        templates/
          actions.ts
          page.tsx
          template-form.tsx
          template-list.tsx
          template-page-model.ts
          template-page-model.test.mjs
  components/
    ai/
      ai-assistant-panel.tsx
      ai-assistant-panel-model.ts
      ai-template-organize-preview.tsx
      ai-template-organize-preview-model.ts
      ai-template-organize-preview-model.test.mjs
    templates/
      template-selector.tsx
      template-selector-model.ts
      template-selector-model.test.mjs
  constants/
    knowledge-templates.ts
  lib/
    ai/
      actions.ts
      prompts.ts
      schemas.ts
      *.test.mjs
    db/
      knowledge-templates.ts
      knowledge-templates.test.mjs
      schema.ts
  types/
    ai.ts
    knowledge-templates.ts
db/
  migrations/
    0004_knowledge_templates.sql
docs/
  versions/
    v0.4/
      prd.md
      technical-design.md
      implementation-plan.md
      acceptance-checklist.md
```

说明：

- `src/lib/db/knowledge-templates.ts` 只处理模板数据访问和默认模板初始化，不包含 React 状态。
- `src/constants/knowledge-templates.ts` 保存 8 个内置模板定义，便于初始化和测试复用。
- `src/components/templates/*` 处理模板选择器等可复用 UI。
- `settings/templates` 可以作为独立路由；如果后续发现设置页仍很轻，也可以先在 `settings-panel.tsx` 中挂载模板管理区域，但数据与表单逻辑仍建议拆出。

## 4. 数据模型

### 4.1 KnowledgeTemplate 类型

新增 `src/types/knowledge-templates.ts`：

```ts
import type { KnowledgeType } from "./knowledge";

export type KnowledgeTemplate = {
  id: string;
  user_id: string;
  name: string;
  type: KnowledgeType | null;
  description: string | null;
  content: string;
  ai_instructions: string | null;
  is_enabled: boolean;
  is_default: boolean;
  is_global_default: boolean;
  source: "builtin" | "user";
  created_at: string;
  updated_at: string;
};

export type KnowledgeTemplateInput = {
  name: string;
  type: KnowledgeType | null;
  description?: string | null;
  content: string;
  ai_instructions?: string | null;
  is_enabled?: boolean;
  is_default?: boolean;
  is_global_default?: boolean;
  source?: "builtin" | "user";
};
```

现有知识类型值保持不变：

| 代码值 | 展示名 |
|---|---|
| `note` | 笔记 |
| `link` | 链接 |
| `prompt` | Prompt |
| `project` | 项目记录 |
| `log` | 日志 |
| `excerpt` | 摘录 |
| `plan` | 计划 |
| `snippet` | 代码片段 |

### 4.2 数据库表

新增迁移 `db/migrations/0004_knowledge_templates.sql`：

```sql
create table if not exists public.knowledge_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text,
  description text,
  content text not null,
  ai_instructions text,
  is_enabled boolean not null default true,
  is_default boolean not null default false,
  is_global_default boolean not null default false,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint knowledge_templates_name_not_empty
    check (length(trim(name)) > 0),
  constraint knowledge_templates_content_not_empty
    check (length(trim(content)) > 0),
  constraint knowledge_templates_type_check
    check (type is null or type in (
      'note',
      'link',
      'prompt',
      'project',
      'log',
      'excerpt',
      'plan',
      'snippet'
    )),
  constraint knowledge_templates_source_check
    check (source in ('builtin', 'user')),
  constraint knowledge_templates_default_scope_check
    check (
      (is_global_default = true and type is null and is_default = false)
      or
      (is_global_default = false)
    ))
);

create unique index if not exists knowledge_templates_user_type_default_idx
on public.knowledge_templates (user_id, type)
where is_default = true and type is not null;

create unique index if not exists knowledge_templates_user_global_default_idx
on public.knowledge_templates (user_id)
where is_global_default = true;

create index if not exists knowledge_templates_user_type_idx
on public.knowledge_templates (user_id, type, is_enabled, updated_at desc);

create trigger set_knowledge_templates_updated_at
before update on public.knowledge_templates
for each row execute function public.set_updated_at();

alter table public.knowledge_templates enable row level security;

create policy "knowledge_templates_select_own"
on public.knowledge_templates
for select
to authenticated
using (auth.uid() = user_id);

create policy "knowledge_templates_insert_own"
on public.knowledge_templates
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "knowledge_templates_update_own"
on public.knowledge_templates
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "knowledge_templates_delete_own"
on public.knowledge_templates
for delete
to authenticated
using (auth.uid() = user_id);
```

说明：

- `knowledge_templates_user_type_default_idx` 负责兜底保证同一用户同一类型只有一个默认模板。
- `knowledge_templates_user_global_default_idx` 负责兜底保证同一用户只有一个全局默认模板。
- 默认模板设定仍应在 repository 层事务中先清空同类型默认值，再设置目标模板。
- 如果用户停用默认模板，业务层应同时阻止停用，或自动将该类型另一个启用模板设为默认。V0.4 推荐先阻止停用默认模板，提示“请先设置其他默认模板”。
- `source` 表示模板来源。默认模板初始化为 `builtin`，用户新增模板为 `user`；该字段用于后续批量升级或识别默认模板来源，不作为权限边界。

## 5. 默认模板初始化

V0.4 推荐采用 PRD 中的方案 A：默认模板写入每个用户。

新增 `src/constants/knowledge-templates.ts`：

```ts
import type { KnowledgeTemplateInput } from "@/types/knowledge-templates";

export const DEFAULT_KNOWLEDGE_TEMPLATES = [
  {
    name: "笔记模板",
    type: "note",
    description: "用于学习笔记、思考记录和通用知识沉淀。",
    content: "## 核心内容\n\n## 关键要点\n\n## 我的理解\n\n## 相关知识\n\n## 后续行动",
    ai_instructions:
      "将原始内容整理为清晰的学习或思考笔记。保留用户自己的观点和理解。不要扩展无依据的内容。",
    is_enabled: true,
    is_default: true,
    source: "builtin",
  },
  // 其余 7 个模板按 PRD 填充
] as const satisfies readonly KnowledgeTemplateInput[];
```

初始化函数放在 `src/lib/db/knowledge-templates.ts`：

```ts
export async function ensureDefaultKnowledgeTemplates(userId: string): Promise<void>;
```

执行策略：

1. 查询当前用户是否已有模板。
2. 如果没有模板，为该用户创建 8 个默认模板。
3. 如果已有模板，不覆盖用户数据。
4. 初始化逻辑集中在 repository 层。
5. 模板管理页进入时必须调用初始化；如果用户绕过模板管理页，首次触发模板化整理前也调用同一初始化函数。

## 6. Repository 设计

`src/lib/db/knowledge-templates.ts` 建议导出：

```ts
export async function listKnowledgeTemplates(userId: string): Promise<KnowledgeTemplate[]>;
export async function listEnabledKnowledgeTemplates(userId: string): Promise<KnowledgeTemplate[]>;
export async function listEnabledKnowledgeTemplatesByType(
  userId: string,
  type: KnowledgeType,
): Promise<KnowledgeTemplate[]>;
export async function getKnowledgeTemplateById(
  userId: string,
  templateId: string,
): Promise<KnowledgeTemplate | null>;
export async function getDefaultKnowledgeTemplateByType(
  userId: string,
  type: KnowledgeType,
): Promise<KnowledgeTemplate | null>;
export async function getGlobalDefaultKnowledgeTemplate(
  userId: string,
): Promise<KnowledgeTemplate | null>;
export async function createKnowledgeTemplate(
  userId: string,
  input: KnowledgeTemplateInput,
): Promise<KnowledgeTemplate>;
export async function updateKnowledgeTemplate(
  userId: string,
  templateId: string,
  input: Partial<KnowledgeTemplateInput>,
): Promise<KnowledgeTemplate | null>;
export async function deleteKnowledgeTemplate(
  userId: string,
  templateId: string,
): Promise<boolean>;
export async function setDefaultKnowledgeTemplate(
  userId: string,
  templateId: string,
): Promise<KnowledgeTemplate | null>;
export async function setGlobalDefaultKnowledgeTemplate(
  userId: string,
  templateId: string,
): Promise<KnowledgeTemplate | null>;
export async function ensureDefaultKnowledgeTemplates(userId: string): Promise<void>;
```

关键规则：

- 所有查询必须显式携带 `userId`。
- `createKnowledgeTemplate()` 和 `updateKnowledgeTemplate()` 需要 trim `name`、`description`、`content`、`ai_instructions`。
- `name` 和 `content` 为空时拒绝保存。
- `setDefaultKnowledgeTemplate()` 必须校验目标模板属于当前用户且已启用。
- `setGlobalDefaultKnowledgeTemplate()` 必须校验目标模板属于当前用户、已启用，并将模板 `type` 置为 `null` 或仅允许选择 `type = null` 的通用模板。V0.4 最小 UI 可以不暴露该功能，但 repository 要支持回退读取。
- `deleteKnowledgeTemplate()` 不允许删除某类型唯一启用模板；如果删除默认模板，必须先让用户设置其他默认模板。V0.4 最小版本可直接阻止删除默认模板。

## 7. AI Action 扩展

### 7.1 类型定义

`src/types/ai.ts` 中将 `AIAction` 扩展为：

```ts
export type AIAction =
  | "generate_summary"
  | "suggest_tags"
  | "suggest_category"
  | "improve_title"
  | "organize_content"
  | "template_organize";
```

`AIGenerateRequest` 增加模板与当前元数据：

```ts
export type AIGenerateRequest = {
  action: AIAction;
  knowledgeItemId?: string;
  title?: string;
  content?: string;
  modelId?: string;
  type?: KnowledgeType;
  category?: string;
  tags?: string[];
  templateId?: string;
};
```

`AIGenerateResult` 增加：

```ts
export type AITemplateOrganizeResult = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  category: string | null;
  reasoning?: string;
};
```

### 7.2 上下文构建

`src/lib/ai/actions.ts` 的 `AIGenerateContext` 增加：

```ts
type AIGenerateContext = {
  action: AIAction;
  knowledgeItemId: string | null;
  title: string;
  content: string;
  type: KnowledgeType | null;
  category: string | null;
  existingTags: string[];
  existingCategories: string[];
  template: {
    id: string;
    name: string;
    type: KnowledgeType | null;
    content: string;
    sections: string[];
    aiInstructions: string | null;
  } | null;
};
```

`template_organize` 的构建规则：

1. 如果传入 `knowledgeItemId`，先用 `getKnowledgeItemById(userId, id)` 校验知识归属。
2. 如果传入 `templateId`，用 `getKnowledgeTemplateById(userId, templateId)` 校验模板归属和启用状态。
3. 如果未传入 `templateId`，按当前类型加载默认模板。
4. 如果手动选择的模板已删除或停用，回退到当前类型默认模板。
5. 如果当前类型没有可用默认模板，回退到全局默认模板。
6. 当前类型优先级：请求 `type` > 已保存知识 `type`。
7. 当前分类优先级：请求 `category` > 已保存知识分类名。
8. 当前标签优先级：请求 `tags` > 已保存知识标签。
9. 未找到可用模板时返回 `template_not_found`。

模板上下文必须同时包含原始模板正文和由系统解析出的 H2 段落清单：

```ts
export function extractTemplateSections(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## ") && !line.startsWith("### "))
    .map((line) => line.replace(/^##\s+/, "").trim())
    .filter(Boolean);
}
```

模板正文合法性：

- `content` trim 后非空。
- 至少包含一个 H2 段落。
- H2 段落标题去重后数量必须与原始数量一致，避免重复段落导致应用结果不可预测。

## 8. Prompt 与 Schema

### 8.1 Prompt

`src/lib/ai/prompts.ts` 为 `template_organize` 增加专用 Prompt：

```txt
请根据当前知识类型、分类、标签和模板，将用户正文整理成结构化 Markdown。

要求：
1. 严格遵循模板正文结构。
2. 不要编造用户没有提供的信息。
3. 某个模板段落没有信息时写“未提及”。
4. 保留原文中明确的事实、代码、链接、决策和行动项。
5. content 中的 H2 段落必须与“模板 H2 段落清单”完全一致且顺序一致。
6. 不要新增模板外的 H2 段落。
7. 输出 JSON，不要输出 Markdown 代码围栏。

返回 JSON：
{
  "title": "优化后的标题",
  "summary": "摘要",
  "content": "按模板整理后的 Markdown 正文",
  "tags": ["标签1", "标签2"],
  "category": "已有分类名或 null",
  "reasoning": "一句话说明整理依据"
}
```

Prompt 输入包含：

- 知识标题。
- 知识正文。
- 当前类型标签和值。
- 当前分类。
- 当前标签。
- 用户已有分类。
- 当前模板名称。
- 当前模板 Markdown 结构。
- 当前模板 H2 段落清单。
- 当前模板 AI 整理要求。
- 当前用户选择的模型。

`aiInstructions` 是用户可编辑内容，必须作为用户上下文输入，不允许放在 system prompt 中覆盖安全规则。system prompt 负责固定安全边界：不编造、不越权、不泄露密钥、只返回 JSON。

### 8.2 Schema 校验

`src/lib/ai/schemas.ts` 增加 `template_organize` 校验：

- `title` 必须是非空字符串。
- `summary` 必须是非空字符串。
- `content` 必须是非空字符串，并通过模板 H2 段落一致性校验。
- `content` 长度不能超过服务端配置的 AI 输出长度上限；如果当前没有单独配置，先复用 `AI_MAX_INPUT_CHARS` 作为保护上限。
- `tags` 必须是字符串数组，trim、去空、去重后最多保留 8 个。
- `category` 可以是字符串或 `null`。
- 如果 `category` 不在当前用户已有分类中，服务端将其置为 `null`，前端提示用户手动选择或先创建分类。
- `reasoning` 可选；如果存在，最长保留 200 字符。
- `reasoning` 仅前端临时展示，不入库，不写入 AI 使用日志。

Schema 校验可以使用 Zod、JSON Schema 或项目现有显式校验函数；不能只依赖 TypeScript 类型。Provider 必须使用 JSON 模式或等价结构化输出方式。JSON 解析失败、schema 校验失败或模板 H2 不一致时，统一返回 `invalid_provider_response`，不进入预览，不写入知识数据。

## 9. API 行为

`POST /api/ai` 新增请求示例：

```json
{
  "action": "template_organize",
  "knowledgeItemId": "uuid",
  "title": "当前标题",
  "content": "当前正文",
  "type": "project",
  "category": "工作",
  "tags": ["React", "bug修复"],
  "templateId": "uuid",
  "modelId": "default"
}
```

成功响应：

```json
{
  "ok": true,
  "result": {
    "title": "React 分类筛选请求未触发问题复盘",
    "summary": "记录一次列表页切换分类后未重新请求数据的问题，根因是 useEffect 依赖遗漏 categoryId。",
    "content": "## 背景\n\n...\n\n## 后续行动\n\n...",
    "tags": ["React", "useEffect", "bug修复"],
    "category": "工作",
    "reasoning": "根据项目记录模板提取背景、问题、原因和解决方案。"
  }
}
```

新增错误码：

| code | HTTP | 场景 |
|---|---:|---|
| `template_not_found` | 400 | 当前类型没有可用模板，或指定模板不存在 |
| `template_disabled` | 400 | 指定模板已停用 |
| `invalid_template` | 400 | 模板正文为空或结构不合法 |
| `invalid_provider_response` | 502 | AI 返回非法 JSON、字段不合法或 H2 段落与模板不一致 |

`ai_usage_logs.action_type` 的 check constraint 需要加入 `template_organize`。

## 10. 前端交互设计

### 10.1 设置页模板管理

推荐独立路由：

```txt
/app/settings/templates
```

页面结构：

```txt
知识模板
[新建模板]

类型筛选：[全部 / 笔记 / 链接 / Prompt / 项目记录 / 日志 / 摘录 / 计划 / 代码片段]

模板列表：
- 项目记录模板
  类型：项目记录
  默认模板
  已启用
  [编辑] [设为默认] [删除]
```

V0.4 最小版本先支持：

- 查看模板列表。
- 新建模板。
- 编辑模板。
- 删除非默认模板。
- 设为默认模板。

复制、启用/停用、模板预览可以作为可选增强；如果实现启用/停用，必须处理默认模板停用规则。

### 10.2 编辑页模板匹配

在新建和编辑知识页面的类型选择附近展示：

```txt
当前模板：项目记录模板    [切换模板]

[AI 按模板整理]
```

行为规则：

1. 类型变化时，自动加载该类型默认模板。
2. 用户手动切换模板后，只影响当前编辑会话，不自动修改类型默认模板。
3. 当前类型没有可用模板时，禁用“AI 按模板整理”，展示明确提示。
4. 未保存的新知识也可以使用模板整理，只是不传 `knowledgeItemId`。

### 10.3 AI 前后对比

AI 返回后显示：

桌面端：

```txt
左侧：原始正文
右侧：AI 整理后正文
```

移动端：

```txt
上方：原始正文
下方：AI 整理后正文
```

标题、摘要、标签、分类使用分区块展示，每个分区提供应用动作。

### 10.4 分区应用

编辑页中，应用动作只更新本地表单状态：

- 应用标题：`setTitle(result.title)`。
- 应用摘要：写入本地 summary 状态；如果当前表单暂不支持 summary，则只在已保存详情页支持。
- 应用正文：`setContent(result.content)`，替换前需要确认。
- 应用标签：追加到现有标签，去重。
- 应用分类：如果推荐分类匹配现有分类，则选中对应分类。
- 全部应用：按上述规则批量更新本地状态。

详情页中，应用动作必须走窄口径 Server Actions：

- `applyKnowledgeItemTitleAction(itemId, title)`。
- `applyKnowledgeItemSummaryAction(itemId, summary)`。
- `replaceKnowledgeItemContentAction(itemId, content)`。
- `applyKnowledgeItemTagsAction(itemId, selectedTagNames)`。
- `applyKnowledgeItemCategoryAction(itemId, categoryId)`。

## 11. 权限、安全与日志

模板权限：

- 所有模板查询、创建、修改、删除都必须携带 `userId`。
- Server Action 中通过 `requireUser()` 获取当前用户。
- 用户不能通过模板 ID 读取或使用他人模板。

AI 权限：

- `template_organize` 如果带 `knowledgeItemId`，必须校验知识归属。
- `template_organize` 如果带 `templateId`，必须校验模板归属。
- AI 请求失败不能修改任何知识数据。
- AI 日志不保存完整正文、模板正文或 AI 输出全文，只保存 action、model、status、inputLength、outputLength 和安全错误摘要。
- `aiInstructions` 是不可信用户输入，不能覆盖 system prompt 的安全规则。
- `reasoning` 只允许作为前端临时展示字段，不入库，不写日志。

## 12. 测试策略

建议新增或扩展测试：

```txt
src/lib/db/knowledge-templates.test.mjs
src/components/templates/template-selector-model.test.mjs
src/app/app/settings/templates/template-page-model.test.mjs
src/lib/ai/actions.test.mjs
src/lib/ai/prompts.test.mjs
src/lib/ai/schemas.test.mjs
src/components/ai/ai-template-organize-preview-model.test.mjs
src/app/api/ai/route.test.mjs
```

验证命令：

```bash
npm run test:knowledge-items
npm run test:categories
npm run test:tags
npm run test:ai
npm run build
```

真实模型调用不进入默认测试。`template_organize` 的 Provider 测试使用 mock 返回。

## 13. 部署与迁移

上线前检查：

1. `db/migrations/0004_knowledge_templates.sql` 已在目标数据库执行。
2. `knowledge_templates` RLS 已启用。
3. `ai_usage_logs_action_type_check` 已支持 `template_organize`。
4. 新用户首次进入模板功能时能初始化 8 个默认模板。
5. 老用户进入模板功能时也能初始化默认模板，且不覆盖已有模板。
6. Vercel 环境变量沿用 V0.3 AI 配置，无需新增模型密钥。
7. 浏览器 Network 中看不到 AI Provider API Key。

## 14. 完成标准

V0.4 完成时应满足：

1. 用户可以管理自己的知识模板。
2. 用户可以看到 8 个内置默认模板。
3. 每个知识类型可以匹配默认模板。
4. 新建和编辑知识时可以看到当前模板并手动切换。
5. AI 可以按模板返回标题、摘要、正文、标签和分类候选结果。
6. 用户可以查看前后对比。
7. 用户可以分区应用 AI 结果。
8. 未确认应用前，原知识内容不变。
9. 模板和知识数据均保持用户隔离。
10. V0.1、V0.2、V0.3 已有功能不回退。
