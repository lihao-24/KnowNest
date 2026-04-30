# KnowNest V0.4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 KnowNest 增加知识模板管理、类型默认模板匹配，以及 AI 按模板整理并分区应用的完整闭环。

**Architecture:** 新增 `knowledge_templates` 表保存用户模板；通过 repository 和 Server Actions 管理模板；在新建/编辑知识页面按当前类型加载默认模板；扩展现有 `/api/ai` 为 `template_organize` action，返回候选结果；前端展示前后对比并由用户确认应用。

**Tech Stack:** Next.js App Router、React 19、TypeScript、Drizzle ORM、PostgreSQL、Supabase Auth/RLS、OpenAI-compatible AI Provider、现有 Node `.test.mjs` 测试脚本。

**Source Requirements:** `docs/KnowNest_V0.4_PRD.md`、`docs/versions/v0.4/technical-design.md`。

---

## 0. 执行原则

- 不让前端直接调用 AI Provider。
- 不把任何 Provider API Key 放入 `NEXT_PUBLIC_*`。
- `/api/ai` 只返回候选结果，不直接覆盖知识数据。
- 所有模板查询和 AI 应用动作都必须校验当前用户。
- AI 日志只保存元信息，不保存完整正文、完整模板或完整 AI 输出。
- 每个阶段先补测试，再实现最小可用逻辑。
- 数据库 migration 可以提交；执行目标环境 migration 需要单独确认。

## 1. 阶段拆分

| 阶段 | 目标 | 主要交付 |
|---|---|---|
| Phase 1 | 模板数据层 | migration、唯一索引、Drizzle schema、类型、默认模板常量、repository |
| Phase 2 | AI 输出契约 | 模板 H2 解析、输出 schema、非法 JSON 和结构不一致错误 |
| Phase 3 | 模板管理 UI | 设置入口、模板列表、表单、创建/编辑/删除/设默认 |
| Phase 4 | 编辑页模板匹配 | 新建/编辑页加载默认模板、手动切换模板、无模板状态 |
| Phase 5 | AI template_organize | 类型扩展、上下文构建、Prompt、路由与日志 |
| Phase 6 | 前后对比与分区应用 | 预览组件、标题/摘要/正文/标签/分类分区应用 |
| Phase 7 | 验证与部署准备 | 单元测试、构建、迁移和手动验收 |

## Task 1: 数据库 migration 与 Drizzle schema

**Files:**

- Create: `db/migrations/0004_knowledge_templates.sql`
- Modify: `src/lib/db/schema.ts`
- Test: `src/lib/db/knowledge-templates.test.mjs`

- [ ] **Step 1: 新增 migration**

创建 `db/migrations/0004_knowledge_templates.sql`，包含：

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
    )
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

- [ ] **Step 2: 更新 `ai_usage_logs` action check**

同一个 migration 中扩展 `ai_usage_logs_action_type_check`，加入 `template_organize`。如果现有 constraint 不能 `if exists` 兼容，需要使用 `alter table ... drop constraint if exists` 后重建。

- [ ] **Step 3: 同步 Drizzle schema**

在 `src/lib/db/schema.ts` 增加 `knowledgeTemplates` 表定义，字段与 migration 保持一致。

- [ ] **Step 4: 增加 schema 测试**

创建或扩展 `src/lib/db/knowledge-templates.test.mjs`，断言：

```js
assert.ok(schema.knowledgeTemplates);
assert.ok(schema.knowledgeTemplates.user_id);
assert.ok(schema.knowledgeTemplates.type);
assert.ok(schema.knowledgeTemplates.content);
assert.ok(schema.knowledgeTemplates.is_default);
assert.ok(schema.knowledgeTemplates.is_global_default);
assert.ok(schema.knowledgeTemplates.source);
```

- [ ] **Step 5: 运行验证**

Run:

```bash
npm run test:knowledge-items
```

Expected: PASS。新增测试脚本后同步运行模板测试。

## Task 2: 模板类型、默认模板常量和 repository

**Files:**

- Create: `src/types/knowledge-templates.ts`
- Create: `src/constants/knowledge-templates.ts`
- Create: `src/lib/db/knowledge-templates.ts`
- Create/Modify: `src/lib/db/knowledge-templates.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: 新增模板类型**

创建 `src/types/knowledge-templates.ts`，定义 `KnowledgeTemplate`、`KnowledgeTemplateInput`、`KnowledgeTemplateFormValues`。

- [ ] **Step 2: 新增 8 个默认模板常量**

创建 `src/constants/knowledge-templates.ts`，按 PRD 写入 8 个模板：

```txt
note      -> 笔记模板
link      -> 链接模板
prompt    -> Prompt 模板
project   -> 项目记录模板
log       -> 日志模板
excerpt   -> 摘录模板
plan      -> 计划模板
snippet   -> 代码片段模板
```

每个模板必须包含 `name`、`type`、`description`、`content`、`ai_instructions`、`is_enabled: true`、`is_default: true`、`source: "builtin"`。

- [ ] **Step 3: 实现 repository**

创建 `src/lib/db/knowledge-templates.ts`，导出：

```ts
listKnowledgeTemplates(userId)
listEnabledKnowledgeTemplates(userId)
listEnabledKnowledgeTemplatesByType(userId, type)
getKnowledgeTemplateById(userId, templateId)
getDefaultKnowledgeTemplateByType(userId, type)
getGlobalDefaultKnowledgeTemplate(userId)
createKnowledgeTemplate(userId, input)
updateKnowledgeTemplate(userId, templateId, input)
deleteKnowledgeTemplate(userId, templateId)
setDefaultKnowledgeTemplate(userId, templateId)
setGlobalDefaultKnowledgeTemplate(userId, templateId)
ensureDefaultKnowledgeTemplates(userId)
```

- [ ] **Step 4: 实现默认模板初始化规则**

`ensureDefaultKnowledgeTemplates(userId)`：

1. 查询当前用户模板数量。
2. 数量为 0 时插入 8 个默认模板，`source` 标记为 `builtin`。
3. 数量大于 0 时不覆盖用户数据。
4. 模板管理页进入时调用；首次触发模板化整理前也调用同一个函数。

- [ ] **Step 5: 实现默认模板切换事务**

`setDefaultKnowledgeTemplate(userId, templateId)`：

1. 查询目标模板并校验归属。
2. 校验目标模板已启用。
3. 将当前用户同类型模板 `is_default` 置为 `false`。
4. 将目标模板 `is_default` 置为 `true`。

- [ ] **Step 6: 实现全局默认读取**

`getGlobalDefaultKnowledgeTemplate(userId)` 只返回当前用户 `is_global_default = true` 且启用的模板。

`setGlobalDefaultKnowledgeTemplate(userId, templateId)` 必须保证同一用户最多一个全局默认模板，并与 `knowledge_templates_user_global_default_idx` 一致。V0.4 最小 UI 可以不暴露该功能，但 repository 和匹配逻辑要支持读取。

- [ ] **Step 7: 增加测试脚本**

在 `package.json` 增加：

```json
"test:knowledge-templates": "node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/db/knowledge-templates.test.mjs"
```

- [ ] **Step 8: 运行验证**

Run:

```bash
npm run test:knowledge-templates
```

Expected: PASS。

## Task 3: AI 输出契约与模板结构校验

**Files:**

- Create: `src/lib/ai/template-sections.ts`
- Create: `src/lib/ai/template-sections.test.mjs`
- Modify: `src/lib/ai/schemas.ts`
- Modify: `src/lib/ai/schemas.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: 实现模板 H2 解析**

创建 `src/lib/ai/template-sections.ts`：

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

- [ ] **Step 2: 实现模板合法性校验**

同文件导出：

```ts
export function validateTemplateSections(content: string): string[] {
  const sections = extractTemplateSections(content);
  const uniqueSections = new Set(sections);

  if (!content.trim() || sections.length === 0) {
    throw new Error("模板正文至少需要包含一个二级标题。");
  }

  if (uniqueSections.size !== sections.length) {
    throw new Error("模板正文不能包含重复的二级标题。");
  }

  return sections;
}
```

- [ ] **Step 3: 实现 AI 正文 H2 一致性校验**

导出：

```ts
export function assertContentMatchesTemplateSections(
  content: string,
  expectedSections: string[],
): void {
  const actualSections = extractTemplateSections(content);

  if (actualSections.length !== expectedSections.length) {
    throw new Error("AI 正文结构与模板不一致。");
  }

  for (let index = 0; index < expectedSections.length; index += 1) {
    if (actualSections[index] !== expectedSections[index]) {
      throw new Error("AI 正文结构与模板不一致。");
    }
  }
}
```

- [ ] **Step 4: 扩展 AI 输出 schema**

`validateAIResult("template_organize", value)` 必须校验：

```ts
{
  title: string;
  summary: string;
  content: string;
  tags: string[];
  category: string | null;
  reasoning?: string;
}
```

并执行：

- JSON 解析失败返回 `invalid_provider_response`。
- `content` 通过 H2 段落一致性校验。
- `tags` 去空、去重，最多保留 8 个。
- `category` 只能是已有分类或 `null`。
- `reasoning` 最多保留 200 字，只给前端临时展示。

- [ ] **Step 5: 增加测试**

覆盖：

- 能提取 `## 背景`、`## 问题`。
- 忽略 `### 子标题`。
- 重复 H2 报错。
- AI 正文缺少 H2 报错。
- AI 正文 H2 顺序不一致报错。
- 非法 JSON 和字段缺失返回格式异常。

- [ ] **Step 6: 运行验证**

Run:

```bash
npm run test:ai
```

Expected: PASS。

## Task 4: 模板管理页面

**Files:**

- Create: `src/app/app/settings/templates/page.tsx`
- Create: `src/app/app/settings/templates/actions.ts`
- Create: `src/app/app/settings/templates/template-form.tsx`
- Create: `src/app/app/settings/templates/template-list.tsx`
- Create: `src/app/app/settings/templates/template-page-model.ts`
- Create: `src/app/app/settings/templates/template-page-model.test.mjs`
- Modify: `src/app/app/settings/settings-panel.tsx`
- Modify: `package.json`

- [ ] **Step 1: 新增设置入口**

在 `settings-panel.tsx` 中增加“知识模板”区域，提供跳转：

```txt
/app/settings/templates
```

- [ ] **Step 2: 新增模板管理页**

`page.tsx`：

1. `requireUser()`。
2. `ensureDefaultKnowledgeTemplates(user.id)`。
3. `listKnowledgeTemplates(user.id)`。
4. 渲染 `TemplateList` 和 `TemplateForm`。

- [ ] **Step 3: 实现 Server Actions**

`actions.ts` 导出：

```ts
createKnowledgeTemplateAction(formData)
updateKnowledgeTemplateAction(templateId, formData)
deleteKnowledgeTemplateAction(templateId)
setDefaultKnowledgeTemplateAction(templateId)
```

每个 action 内部调用 `requireUser()`，只操作当前用户模板。

- [ ] **Step 4: 实现表单校验模型**

`template-page-model.ts` 处理：

- trim 字段。
- `name` 为空返回“请输入模板名称。”
- `content` 为空返回“请输入模板正文结构。”
- `type` 必须属于 `KNOWLEDGE_TYPES`。
- 默认模板删除时返回“默认模板不能直接删除，请先设置其他默认模板。”

- [ ] **Step 5: 实现列表和表单 UI**

V0.4 最小可用 UI 支持：

- 类型筛选。
- 新建模板。
- 编辑模板。
- 删除非默认模板。
- 设为默认模板。

- [ ] **Step 6: 运行验证**

Run:

```bash
npm run test:knowledge-templates
npm run build
```

Expected: PASS。

## Task 5: 新建/编辑页模板匹配

**Files:**

- Create: `src/components/templates/template-selector.tsx`
- Create: `src/components/templates/template-selector-model.ts`
- Create: `src/components/templates/template-selector-model.test.mjs`
- Modify: `src/app/app/items/new/page.tsx`
- Modify: `src/app/app/items/new/knowledge-form.tsx`
- Modify: `src/app/app/items/[id]/edit/page.tsx`
- Modify: `src/app/app/items/[id]/knowledge-item-editor.tsx`
- Modify: `package.json`

- [ ] **Step 1: 页面加载模板数据**

在新建页和编辑页服务端加载：

```ts
await ensureDefaultKnowledgeTemplates(user.id);
const templates = await listEnabledKnowledgeTemplates(user.id);
```

把模板列表传给对应表单组件。

- [ ] **Step 2: 实现模板选择模型**

`template-selector-model.ts` 导出：

```ts
resolveDefaultTemplateForType(templates, type)
resolveSelectedTemplate(templates, type, selectedTemplateId)
filterTemplatesByType(templates, type)
```

- [ ] **Step 3: 接入表单**

在类型选择附近展示：

```txt
当前模板：xxx
[切换模板]
```

类型变化时，如果用户没有手动选择模板，自动切换到该类型默认模板。

- [ ] **Step 4: 处理无模板状态**

当前类型无可用模板时：

```txt
当前类型暂无可用模板，请先在设置中创建模板。
```

禁用“AI 按模板整理”。

- [ ] **Step 5: 运行验证**

Run:

```bash
npm run test:knowledge-templates
npm run build
```

Expected: PASS。

## Task 6: 扩展 AI 类型、Prompt、Schema 和路由

**Files:**

- Modify: `src/types/ai.ts`
- Modify: `src/lib/ai/actions.ts`
- Modify: `src/lib/ai/actions.test.mjs`
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/prompts.test.mjs`
- Modify: `src/lib/ai/schemas.ts`
- Modify: `src/lib/ai/schemas.test.mjs`
- Modify: `src/app/api/ai/route-handler.ts`
- Modify: `src/app/api/ai/route.test.mjs`

- [ ] **Step 1: 增加 `template_organize` action**

扩展 `AIAction`、`AIGenerateRequest`、`AIGenerateResult`。

- [ ] **Step 2: 解析请求参数**

`parseAIGenerateRequest()` 支持：

```ts
type?: KnowledgeType;
category?: string;
tags?: string[];
templateId?: string;
```

`template_organize` 必须能拿到 `content` 或 `knowledgeItemId`，并且必须能解析出 `type` 或从已保存知识中拿到类型。

- [ ] **Step 3: 构建模板上下文**

`buildAIGenerateContext()`：

1. 校验知识归属。
2. 校验模板归属。
3. 手动模板已删除或停用时，回退到当前类型默认模板。
4. 未传模板时按类型查默认模板。
5. 类型默认模板不可用时，回退到全局默认模板。
6. 对最终模板执行 `validateTemplateSections()`。
7. 未找到模板时抛出 `template_not_found`。

- [ ] **Step 4: 构造 Prompt**

`buildAIMessages()` 为 `template_organize` 加入模板正文结构、模板 H2 段落清单和 AI 整理要求。

`aiInstructions` 必须作为用户上下文输入，不允许放进 system prompt 覆盖安全规则。

- [ ] **Step 5: 校验返回结构**

复用 Task 3 的 schema 和模板 H2 一致性校验。`validateAIResult("template_organize", value)` 返回：

```ts
{
  title: string;
  summary: string;
  content: string;
  tags: string[];
  category: string | null;
  reasoning?: string;
}
```

- [ ] **Step 6: 路由日志支持新 action**

`route-handler.ts` 继续记录成功/失败日志，`actionType` 支持 `template_organize`。

非法 JSON、schema 校验失败或模板 H2 不一致时，只记录错误元信息，不进入预览，不写入知识数据。

- [ ] **Step 7: 运行验证**

Run:

```bash
npm run test:ai
npm run build
```

Expected: PASS。

## Task 7: AI 按模板整理按钮与前后对比预览

**Files:**

- Modify: `src/components/ai/ai-assistant-panel.tsx`
- Modify: `src/components/ai/ai-assistant-panel-model.ts`
- Modify: `src/components/ai/ai-assistant-panel-model.test.mjs`
- Create: `src/components/ai/ai-template-organize-preview.tsx`
- Create: `src/components/ai/ai-template-organize-preview-model.ts`
- Create: `src/components/ai/ai-template-organize-preview-model.test.mjs`
- Modify: `src/app/app/items/new/knowledge-form.tsx`
- Modify: `src/app/app/items/[id]/knowledge-item-editor.tsx`

- [ ] **Step 1: 增加模板整理请求**

在 AI 面板中新增“AI 按模板整理”入口，请求：

```json
{
  "action": "template_organize",
  "knowledgeItemId": "...",
  "title": "...",
  "content": "...",
  "type": "project",
  "category": "工作",
  "tags": ["React"],
  "templateId": "..."
}
```

- [ ] **Step 2: 实现预览模型**

`ai-template-organize-preview-model.ts` 提供：

- 原始正文和 AI 正文对比数据。
- 标签合并去重。
- 推荐分类匹配已有分类。
- “全部应用”可应用字段集合。

- [ ] **Step 3: 实现前后对比 UI**

桌面端左右对比，移动端上下对比。正文区域要有稳定宽度和滚动边界，避免长 Markdown 撑破布局。

- [ ] **Step 4: 错误和空状态**

覆盖：

- 没有可用模板。
- 输入内容太短。
- AI 返回格式异常。
- 推荐分类不存在。

- [ ] **Step 5: 运行验证**

Run:

```bash
npm run test:ai
npm run build
```

Expected: PASS。

## Task 8: 分区应用

**Files:**

- Modify: `src/app/app/items/[id]/actions.ts`
- Modify: `src/app/app/items/[id]/knowledge-item-editor.tsx`
- Modify: `src/app/app/items/new/knowledge-form.tsx`
- Modify: `src/components/ai/ai-template-organize-preview.tsx`
- Modify: `src/components/ai/ai-template-organize-preview-model.ts`
- Modify: `src/lib/knowledge/knowledge-item-summary.test.mjs`

- [ ] **Step 1: 编辑页本地应用**

在编辑页中：

- 应用标题：更新 `title` state。
- 应用正文：替换 `content` state。
- 应用标签：追加到 `tagNames` state 并去重。
- 应用分类：推荐分类匹配已有分类后更新 `categoryId` state。
- 全部应用：按上述规则批量更新。

- [ ] **Step 2: 新建页本地应用**

新建页使用同样规则，但不传 `knowledgeItemId`。

- [ ] **Step 3: 已保存详情页 Server Actions**

如果详情页也开放模板整理结果应用，复用或新增窄口径 actions：

```ts
applyKnowledgeItemTitleAction(itemId, title)
applyKnowledgeItemSummaryAction(itemId, summary)
replaceKnowledgeItemContentAction(itemId, content)
applyKnowledgeItemTagsAction(itemId, selectedTagNames)
applyKnowledgeItemCategoryAction(itemId, categoryId)
```

- [ ] **Step 4: 分类应用规则**

AI 推荐分类必须匹配当前用户已有分类；不匹配时不自动创建，只提示：

```txt
AI 推荐分类「xxx」当前不存在，请手动选择或先创建分类。
```

可以提供“创建并选中该分类”次级操作，但该操作必须走现有分类创建权限校验。

- [ ] **Step 5: 标签应用上限**

推荐标签合并到当前标签时必须去重，并遵守项目标签数量上限。若当前项目没有显式上限，V0.4 前端最多自动应用 20 个标签，超过部分保留在预览中由用户手动选择。

- [ ] **Step 6: 运行验证**

Run:

```bash
npm run test:tags
npm run test:categories
npm run test:knowledge-item-draft
npm run build
```

Expected: PASS。

## Task 9: 手动验收与部署准备

**Files:**

- Modify: `docs/operations/workflow-status.md` if implementation status needs to be recorded.
- No source changes required for checklist execution.

- [ ] **Step 1: 运行本地验证**

Run:

```bash
npm run lint
npm run test:knowledge-templates
npm run test:ai
npm run test:knowledge-items
npm run test:tags
npm run test:categories
npm run test:knowledge-item-draft
npm run test:knowledge-list-item
npm run build
```

Expected: 全部 PASS。

- [ ] **Step 2: 执行手动验收**

按 `docs/versions/v0.4/acceptance-checklist.md` 执行模板管理、模板匹配、AI 整理、前后对比、分区应用和权限安全验收。

- [ ] **Step 3: 部署前检查**

确认：

- 生产数据库已执行 `0004_knowledge_templates.sql`。
- Vercel AI 环境变量仍可用。
- 浏览器不会看到 Provider API Key。
- 未登录访问模板管理页会跳转登录。
- 用户不能访问他人模板或他人知识。

## 2. 推荐提交拆分

建议按以下粒度提交：

```txt
feat(templates): add knowledge template schema and defaults
feat(templates): add template management page
feat(templates): match default template in item forms
feat(ai): add template organize action
feat(ai): add template organize preview and apply flow
test(templates): cover template matching and defaults
docs(v0.4): add release acceptance checklist
```

每个提交前至少运行该阶段相关测试；合并 V0.4 前运行全量验证。
