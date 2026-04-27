# KnowNest V0.1 技术架构文档

## 1. 文档信息

| 项目 | 内容 |
|---|---|
| 产品名称 | KnowNest |
| 中文名 | 知巢 |
| 文档名称 | V0.1 技术架构文档 |
| 建议路径 | `docs/technical/architecture.md` |
| 文档版本 | v0.1 |
| 适用阶段 | V0.1 MVP |
| 主要目标 | 指导 V0.1 的工程实现与代码组织 |

---

## 2. 架构目标

KnowNest V0.1 的技术架构目标是：

```text
用尽量简单、稳定、可维护的工程结构，实现一个可长期演进的云端同步个人知识库。
```

V0.1 不追求复杂架构，不追求过度抽象，而是优先保证：

1. 项目能快速启动开发。
2. 代码结构清晰。
3. 认证和数据权限可靠。
4. 页面、组件、数据访问分层明确。
5. 后续可以平滑加入 AI、PWA、iOS App、向量检索等能力。

---

## 3. V0.1 技术选型

## 3.1 总体技术栈

V0.1 推荐技术栈如下：

```text
框架：Next.js
语言：TypeScript
样式：Tailwind CSS
UI 组件：shadcn/ui，可选
数据库：开发期 Supabase PostgreSQL；生产期优先腾讯云轻量应用服务器 + 自建 PostgreSQL
认证：开发期 Supabase Auth；调用边界统一封装在 `src/lib/auth`
部署：开发 / 预览期可使用 Vercel；生产期优先腾讯云轻量应用服务器，HTTPS 后续使用 Caddy / Let's Encrypt
编辑器：textarea + Markdown 渲染
Markdown 渲染：react-markdown 或同类库
表单校验：Zod，可选
图标：lucide-react，可选
```

---

## 3.2 技术选型原则

### 3.2.1 选择 Next.js

选择 Next.js 的原因：

- 适合长期 Web App 项目。
- 可以同时支持页面、服务端逻辑和 API 能力。
- 后续接入 AI 功能会更自然。
- 适合部署到 Vercel 预览环境，也可以部署到 Node.js 服务器。
- 生态成熟，便于后续维护。

### 3.2.2 开发期选择 Supabase

开发期可以使用 Supabase 的原因：

- 提供 PostgreSQL 数据库。
- 提供认证能力。
- 支持 Row Level Security。
- 后续可以扩展 pgvector。
- 对个人项目和 MVP 友好。

但 Supabase 是当前开发期的效率工具，不是 KnowNest 生产期的唯一长期架构。生产期优先迁移到腾讯云轻量应用服务器 + 自建 PostgreSQL，HTTPS 后续使用 Caddy / Let's Encrypt。

因此 V0.1 需要把 Supabase 作为可替换实现隔离：

- 页面和业务组件不得直接调用 Supabase SDK。
- 数据库访问必须经过 `src/lib/db`，或后续明确的 repository / ORM 层。
- 认证调用必须经过 `src/lib/auth`。
- Supabase Auth、RLS、`auth.users`、`auth.uid()`、Dashboard 等专属能力只能出现在 adapter、服务层或迁移脚本边界内。
- V0.1 不实现文件上传，不接入 Supabase Storage，也不接入腾讯云 COS；后续如做附件能力，必须先设计 storage adapter。

### 3.2.3 暂不引入复杂状态管理

V0.1 不建议使用 Redux、MobX、复杂全局状态机。

原因：

- 当前业务状态较简单。
- 大部分数据来自数据库查询。
- 搜索和筛选可以通过 URL Query 或局部状态管理。
- 过早引入复杂状态管理会增加维护成本。

### 3.2.4 暂不引入复杂编辑器

V0.1 不建议一开始引入块编辑器或复杂富文本编辑器。

推荐：

```text
textarea + Markdown 渲染预览
```

原因：

- 开发成本低。
- 数据格式稳定。
- 内容易迁移。
- 对技术笔记、Prompt、代码片段友好。

---

## 4. 总体架构

## 4.1 架构分层

V0.1 建议采用以下分层：

```text
UI 页面层
  ↓
业务组件层
  ↓
认证服务层 / 数据访问层
  ↓
基础设施 adapter
  ↓
开发期 Supabase Auth + PostgreSQL + RLS
生产期自建 PostgreSQL + 服务端权限校验
```

### 4.1.1 UI 页面层

负责：

- 路由页面
- 页面布局
- 页面级数据加载
- 页面级交互组织

### 4.1.2 业务组件层

负责：

- 知识列表
- 知识表单
- 标签选择器
- 筛选器
- Markdown 编辑器
- 空状态、加载状态、错误状态

### 4.1.3 认证服务层与数据访问层

负责封装认证调用和数据库查询。

例如：

```text
createKnowledgeItem
updateKnowledgeItem
getKnowledgeItemById
listKnowledgeItems
deleteKnowledgeItem
listTags
upsertTags
updateItemTags
```

页面和业务组件不得直接调用 Supabase SDK 或 Supabase Auth。

边界要求：

- 页面和业务组件只调用 `src/lib/auth` 暴露的认证函数。
- 页面和业务组件只调用 `src/lib/db` 或后续 repository / ORM 层暴露的数据函数。
- 开发期如果短期使用 Supabase SDK，调用点也必须限制在 `src/lib/auth`、`src/lib/db`、`src/lib/supabase` 或明确 adapter 内部。
- 后续从 Supabase 迁移到自建 PostgreSQL 时，应优先替换 adapter、服务层或 repository，不应改动大批页面组件。

### 4.1.4 基础设施 adapter 层

负责：

- 连接开发期 Supabase Auth / PostgreSQL / RLS。
- 连接生产期自建 PostgreSQL。
- 隔离 Supabase SDK、Supabase Dashboard 操作、RLS policies 等供应商专属能力。
- 为未来存储、备份、AI 等基础设施能力提供可替换边界。

V0.1 不做文件上传，因此当前不创建 Supabase Storage 或腾讯云 COS 相关代码、环境变量和业务入口。

---

## 4.2 架构图

```text
Browser / Mobile Safari / Desktop Browser
        ↓
Next.js App
        ↓
Page Routes / Layouts
        ↓
Components
        ↓
Domain Services / Data Access
        ↓
Infrastructure Adapters
        ↓
Dev: Supabase Auth + PostgreSQL + RLS
Prod target: Tencent Lighthouse + PostgreSQL + Caddy / Let's Encrypt
```

---

## 5. 部署架构

V0.1 需要区分开发期、预览期和生产期目标：

```text
开发期：本地 Next.js + Supabase PostgreSQL / Auth / Dashboard
预览期：可使用 Vercel + Supabase
生产期优先：腾讯云轻量应用服务器 + 自建 PostgreSQL + Caddy / Let's Encrypt
代码仓库：GitHub
```

### 5.1 本地开发

```text
本地 Next.js Dev Server
  ↓
远程 Supabase 项目
```

V0.1 可以直接连接远程 Supabase，减少本地数据库维护成本。

后续如果需要更严格的开发环境，可以再引入 Supabase Local Development。

### 5.2 预览环境

```text
用户浏览器
  ↓
Vercel 部署的 Next.js 应用
  ↓
Supabase Auth / Database
```

Vercel + Supabase 可作为开发预览和临时上线方案，但不应让业务代码与 Supabase SDK 强绑定。

### 5.3 生产环境目标

```text
用户浏览器
  ↓
腾讯云轻量应用服务器
  ↓
Caddy / Let's Encrypt HTTPS
  ↓
Next.js 应用
  ↓
自建 PostgreSQL
```

生产期优先使用自建 PostgreSQL。认证和权限可以在服务端认证层、repository 查询条件和数据库约束中实现；如果仍临时使用 Supabase PostgreSQL / Auth，需要在发布说明中保留迁移计划。

V0.1 不做文件上传，不配置 Supabase Storage 或腾讯云 COS。附件和备份能力后续可以迁移到腾讯云 COS，但进入实现前必须先设计 storage adapter 和备份策略。

---

## 6. 推荐项目目录结构

V0.1 推荐目录结构如下。

```text
knownest/
  docs/
    product-outline.md
    requirements/
      v0.1-mvp.md
    technical/
      architecture.md
      database-schema.md
      api-design.md
      auth-and-security.md
    design/
      page-structure.md
      interaction-guidelines.md
      ui-guidelines.md

  src/
    app/
      login/
        page.tsx
      app/
        layout.tsx
        page.tsx
        inbox/
          page.tsx
        favorites/
          page.tsx
        archive/
          page.tsx
        items/
          new/
            page.tsx
          [id]/
            page.tsx
        settings/
          page.tsx

    components/
      layout/
        app-sidebar.tsx
        app-header.tsx
        mobile-nav.tsx
        app-shell.tsx

      knowledge/
        knowledge-list.tsx
        knowledge-list-item.tsx
        knowledge-editor.tsx
        knowledge-form.tsx
        knowledge-filters.tsx
        knowledge-empty-state.tsx
        favorite-button.tsx
        delete-item-dialog.tsx

      tags/
        tag-input.tsx
        tag-list.tsx
        tag-filter.tsx

      markdown/
        markdown-editor.tsx
        markdown-preview.tsx

      ui/
        button.tsx
        input.tsx
        textarea.tsx
        select.tsx
        dialog.tsx
        badge.tsx
        card.tsx
        skeleton.tsx

    lib/
      supabase/
        client.ts
        server.ts
        middleware.ts
      auth/
        get-current-user.ts
        require-user.ts
      db/
        knowledge-items.ts
        tags.ts
        profiles.ts
      utils/
        date.ts
        strings.ts
        url.ts

    constants/
      knowledge.ts
      routes.ts

    types/
      database.ts
      knowledge.ts
      tags.ts

    middleware.ts

  .env.local
  package.json
  tailwind.config.ts
  next.config.ts
  tsconfig.json
```

---

## 7. 目录职责说明

## 7.1 `src/app`

负责 Next.js 页面和路由。

页面只做：

- 页面结构组织
- 调用数据访问层
- 组合组件
- 处理页面级跳转

页面不应包含大量重复数据库查询逻辑。

---

## 7.2 `src/components`

负责可复用 UI 和业务组件。

建议按业务域拆分：

```text
layout：布局组件
knowledge：知识条目相关组件
tags：标签相关组件
markdown：Markdown 编辑和预览组件
ui：基础 UI 组件
```

---

## 7.3 `src/lib/supabase`

负责开发期 Supabase Client 初始化，并把 Supabase SDK 限制在基础设施边界内。

建议拆分：

```text
client.ts      浏览器端 Supabase Client
server.ts      服务端 Supabase Client
middleware.ts  中间件相关 Supabase 工具
```

页面、业务组件、表单组件不应直接导入 `src/lib/supabase` 或 Supabase SDK。若后续迁移到自建 PostgreSQL，这一层应可以被替换或收缩。

---

## 7.4 `src/lib/auth`

负责认证相关辅助函数，是页面和组件唯一允许调用的认证边界。

例如：

```text
getCurrentUser()
requireUser()
```

### 设计目标

- 页面中不重复写获取用户逻辑。
- 需要登录的页面可以统一校验。
- 后续权限逻辑可集中维护。
- 开发期可在内部调用 Supabase Auth。
- 页面和业务组件不得直接调用 `supabase.auth.*`。
- 生产期如替换认证方案，优先修改 `src/lib/auth` 和相关 adapter。

---

## 7.5 `src/lib/db`

负责数据库访问函数。

例如：

```text
knowledge-items.ts
tags.ts
profiles.ts
```

该目录是 V0.1 的数据访问层。

页面和组件必须调用这里的函数，或后续确定的 repository / ORM 层，而不是直接写 Supabase 查询、SQL client 查询或 ORM 查询。

开发期如果使用 Supabase SDK，Supabase 查询只能封装在 `src/lib/db` 或明确 adapter 内部。所有查询函数必须接收或解析当前用户身份，不能依赖页面层自行过滤用户数据。

---

## 7.6 `src/constants`

负责业务常量。

例如：

```text
空间枚举
状态枚举
类型枚举
路由常量
导航配置
```

---

## 7.7 `src/types`

负责 TypeScript 类型定义。

建议包括：

```text
database.ts    Supabase 表类型，可后续自动生成
knowledge.ts   知识条目领域类型
tags.ts        标签领域类型
```

---

## 8. 路由设计

V0.1 路由如下：

```text
/login
/app
/app/inbox
/app/favorites
/app/archive
/app/items/new
/app/items/[id]
/app/settings
```

## 8.1 路由说明

| 路由 | 页面 | 登录要求 |
|---|---|---|
| `/login` | 登录页 | 否 |
| `/app` | 全部内容 / 首页 | 是 |
| `/app/inbox` | 收集箱 | 是 |
| `/app/favorites` | 收藏 | 是 |
| `/app/archive` | 归档 | 是 |
| `/app/items/new` | 新建知识 | 是 |
| `/app/items/[id]` | 知识详情 / 编辑 | 是 |
| `/app/settings` | 设置 | 是 |

---

## 8.2 路由保护策略

需要登录的路由：

```text
/app/**
```

未登录访问时：

```text
跳转到 /login
```

已登录访问 `/login` 时：

```text
跳转到 /app
```

---

## 8.3 默认页面规则

`/app` 默认展示：

```text
status != archived 的知识条目
按 updated_at 倒序排列
```

`/app/inbox` 默认展示：

```text
status = inbox 的知识条目
```

`/app/favorites` 默认展示：

```text
is_favorite = true 且 status != archived 的知识条目
```

`/app/archive` 默认展示：

```text
status = archived 的知识条目
```

---

## 9. 认证架构

## 9.1 认证方案

V0.1 开发期可以使用 Supabase Auth。

优先支持：

```text
邮箱 + 密码登录
```

后续可扩展：

```text
Magic Link
OAuth 登录
Apple 登录
GitHub 登录
```

认证调用边界必须统一经过：

```text
src/lib/auth
```

页面、布局和业务组件不得直接调用 Supabase Auth API。Supabase Auth 只能作为 `src/lib/auth` 或明确 auth adapter 内部的开发期实现细节。

---

## 9.2 会话管理

基本原则：

1. 开发期登录状态可由 Supabase Auth 维护。
2. 页面刷新后应保持登录状态。
3. 需要登录的页面必须校验用户会话。
4. 退出登录后清除本地会话并回到登录页。
5. 页面层只依赖 `src/lib/auth` 暴露的会话和用户函数。

---

## 9.3 认证流程

```text
用户打开 /login
  ↓
输入邮箱和密码
  ↓
调用 `src/lib/auth` 的登录封装
  ↓
登录成功
  ↓
跳转 /app
```

---

## 9.4 退出流程

```text
用户进入设置页
  ↓
点击退出登录
  ↓
调用 `src/lib/auth` 的退出封装
  ↓
跳转 /login
```

---

## 9.5 用户数据隔离

V0.1 开发期采用双层保护：

```text
前端路由保护
  +
Supabase RLS 数据库权限保护
```

前端不应依赖“隐藏按钮”来保证安全。

如果生产期迁移到自建 PostgreSQL，用户隔离必须由服务端认证、repository 查询条件、数据库约束或 PostgreSQL RLS 共同保证。不要把 Supabase RLS 写成唯一长期权限模型。

---

## 10. 数据访问架构

## 10.1 设计原则

数据库操作集中放在：

```text
src/lib/db/
```

页面和业务组件不得直接调用 Supabase SDK、SQL client 或 ORM。

数据库访问必须经过：

```text
src/lib/db/
```

或后续明确的 repository / ORM 层。

开发期可以在 `src/lib/db` 内部短期调用 Supabase SDK；生产期迁移自建 PostgreSQL 时，应优先替换该层内部实现，保持页面和业务组件调用不变。

---

## 10.2 `knowledge-items.ts`

建议包含以下函数：

```ts
export async function listKnowledgeItems(params: ListKnowledgeItemsParams) {}

export async function getKnowledgeItemById(id: string) {}

export async function createKnowledgeItem(input: CreateKnowledgeItemInput) {}

export async function updateKnowledgeItem(id: string, input: UpdateKnowledgeItemInput) {}

export async function deleteKnowledgeItem(id: string) {}

export async function toggleFavorite(id: string, isFavorite: boolean) {}
```

### 查询参数类型建议

```ts
export type ListKnowledgeItemsParams = {
  keyword?: string
  space?: KnowledgeSpace
  status?: KnowledgeStatus
  type?: KnowledgeType
  tagId?: string
  isFavorite?: boolean
  includeArchived?: boolean
}
```

---

## 10.3 `tags.ts`

建议包含以下函数：

```ts
export async function listTags() {}

export async function createTag(name: string) {}

export async function getOrCreateTags(names: string[]) {}

export async function listTagsByItemId(itemId: string) {}

export async function updateItemTags(itemId: string, tagNames: string[]) {}
```

### 标签保存策略

V0.1 推荐简单策略：

```text
保存知识条目时：
1. 保存 knowledge_items 主表
2. 处理标签名称 trim 和去重
3. 查询或创建 tags
4. 删除当前 item 的旧标签关系
5. 插入新的标签关系
```

---

## 10.4 错误处理约定

数据访问层应统一处理底层数据库或 SDK 返回的错误。

推荐返回方式：

```ts
throw new Error(error.message)
```

页面层负责展示错误提示。

V0.1 不需要复杂错误类型系统，但错误信息不能静默失败。

---

## 11. 数据模型与类型

## 11.1 核心类型

```ts
export type KnowledgeSpace = 'life' | 'work'

export type KnowledgeStatus = 'inbox' | 'organized' | 'archived'

export type KnowledgeType =
  | 'note'
  | 'link'
  | 'prompt'
  | 'project'
  | 'log'
  | 'excerpt'
  | 'plan'
  | 'snippet'

export type KnowledgeItem = {
  id: string
  user_id: string
  title: string
  content: string
  space: KnowledgeSpace
  type: KnowledgeType
  status: KnowledgeStatus
  source_url: string | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export type Tag = {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export type KnowledgeItemWithTags = KnowledgeItem & {
  tags: Tag[]
}
```

---

## 11.2 创建输入类型

```ts
export type CreateKnowledgeItemInput = {
  title?: string
  content?: string
  space?: KnowledgeSpace
  type?: KnowledgeType
  status?: KnowledgeStatus
  source_url?: string | null
  is_favorite?: boolean
  tags?: string[]
}
```

---

## 11.3 更新输入类型

```ts
export type UpdateKnowledgeItemInput = Partial<{
  title: string
  content: string
  space: KnowledgeSpace
  type: KnowledgeType
  status: KnowledgeStatus
  source_url: string | null
  is_favorite: boolean
  tags: string[]
}>
```

---

## 12. 业务常量设计

建议放在：

```text
src/constants/knowledge.ts
```

```ts
export const KNOWLEDGE_SPACES = [
  { value: 'life', label: '生活' },
  { value: 'work', label: '工作' },
] as const

export const KNOWLEDGE_STATUSES = [
  { value: 'inbox', label: '收集箱' },
  { value: 'organized', label: '已整理' },
  { value: 'archived', label: '归档' },
] as const

export const KNOWLEDGE_TYPES = [
  { value: 'note', label: '笔记' },
  { value: 'link', label: '链接' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'project', label: '项目记录' },
  { value: 'log', label: '日志' },
  { value: 'excerpt', label: '摘录' },
  { value: 'plan', label: '计划' },
  { value: 'snippet', label: '代码片段' },
] as const
```

---

## 13. 页面架构

## 13.1 登录页 `/login`

职责：

- 展示产品名和登录表单。
- 调用 `src/lib/auth` 的登录封装。
- 登录成功后跳转 `/app`。
- 展示登录错误。

不负责：

- 业务数据查询。
- 注册复杂流程。
- 第三方登录。

---

## 13.2 主布局 `/app/layout.tsx`

职责：

- 校验用户登录状态。
- 渲染侧边栏或移动端导航。
- 提供主内容区域。
- 提供退出入口或设置入口。

建议结构：

```text
<AppShell>
  <Sidebar />
  <MainContent>{children}</MainContent>
</AppShell>
```

---

## 13.3 首页 `/app/page.tsx`

职责：

- 展示全部非归档知识条目。
- 支持搜索和筛选。
- 提供新建入口。

---

## 13.4 收集箱 `/app/inbox/page.tsx`

职责：

- 展示 `status = inbox` 的知识条目。
- 引导用户整理。

---

## 13.5 收藏 `/app/favorites/page.tsx`

职责：

- 展示 `is_favorite = true` 的知识条目。

---

## 13.6 归档 `/app/archive/page.tsx`

职责：

- 展示 `status = archived` 的知识条目。
- 允许用户恢复归档内容。

---

## 13.7 新建知识 `/app/items/new/page.tsx`

职责：

- 展示知识编辑表单。
- 默认状态为 `inbox`。
- 保存后跳转详情页或列表页。

---

## 13.8 知识详情 `/app/items/[id]/page.tsx`

职责：

- 加载单条知识。
- 展示编辑表单。
- 支持保存、收藏、归档、删除。

---

## 13.9 设置页 `/app/settings/page.tsx`

职责：

- 展示当前用户邮箱。
- 提供退出登录。
- 展示当前版本号。

---

## 14. 组件架构

## 14.1 组件分类

V0.1 组件分为四类：

```text
布局组件
业务组件
表单组件
基础 UI 组件
```

---

## 14.2 布局组件

建议组件：

```text
AppShell
AppSidebar
AppHeader
MobileNav
```

职责：

- 提供应用整体布局。
- 提供导航入口。
- 处理桌面端和移动端布局差异。

---

## 14.3 知识业务组件

建议组件：

```text
KnowledgeList
KnowledgeListItem
KnowledgeForm
KnowledgeEditor
KnowledgeFilters
FavoriteButton
DeleteItemDialog
KnowledgeEmptyState
```

职责：

- 展示知识条目。
- 编辑知识内容。
- 处理筛选条件。
- 处理收藏、删除等业务操作。

---

## 14.4 标签组件

建议组件：

```text
TagInput
TagList
TagFilter
```

职责：

- 输入标签。
- 展示标签。
- 按标签筛选。

---

## 14.5 Markdown 组件

建议组件：

```text
MarkdownEditor
MarkdownPreview
```

V0.1 可以简单实现：

```text
MarkdownEditor = textarea
MarkdownPreview = react-markdown 渲染结果
```

---

## 15. 状态管理策略

## 15.1 总体原则

V0.1 使用轻量状态管理。

优先使用：

```text
React useState
URL Search Params
Server-side data fetching
表单局部状态
```

暂不引入：

```text
Redux
MobX
Zustand，全局复杂状态场景出现前暂不需要
XState
```

---

## 15.2 搜索和筛选状态

建议使用 URL Query 保存搜索和筛选条件。

例如：

```text
/app?keyword=react&space=work&type=note
/app/inbox?keyword=codex
/app?tag=xxx
```

优点：

- 刷新页面后筛选条件不丢失。
- 可以复制链接。
- 页面状态更清晰。

---

## 15.3 表单状态

知识编辑表单使用局部状态即可。

后续如表单复杂，可引入：

```text
react-hook-form + zod
```

V0.1 可以先根据开发效率选择是否引入。

---

## 16. 搜索与筛选架构

## 16.1 V0.1 搜索能力

V0.1 支持基础搜索：

```text
标题搜索
正文搜索
```

数据库层可以使用：

```text
ilike
```

---

## 16.2 筛选能力

支持筛选：

```text
space
type
status
tag
is_favorite
```

---

## 16.3 查询组合

查询逻辑建议集中在：

```text
listKnowledgeItems(params)
```

页面根据 URL Query 组装 params，不直接拼 Supabase 查询。

---

## 16.4 V0.1 不做高级搜索

V0.1 不做：

```text
语义搜索
向量搜索
搜索高亮
复杂排序
模糊推荐
跨字段权重
```

这些放到后续版本。

---

## 17. Markdown 架构

## 17.1 数据存储

Markdown 内容以纯文本方式保存在：

```text
knowledge_items.content
```

---

## 17.2 编辑方式

V0.1 推荐：

```text
textarea 输入 Markdown
可选预览区域展示渲染结果
```

---

## 17.3 支持语法

V0.1 至少支持：

```text
标题
段落
列表
引用
链接
代码块
行内代码
```

---

## 17.4 安全注意

Markdown 渲染时应避免直接渲染不受控 HTML。

V0.1 原则：

```text
默认不允许原始 HTML 直接执行
避免 XSS 风险
```

---

## 18. UI 架构

## 18.1 视觉方向

V0.1 UI 方向：

```text
简洁
干净
轻量
工具型
适合长期阅读和编辑
```

---

## 18.2 布局原则

桌面端：

```text
左侧导航 + 右侧内容区
```

移动端：

```text
顶部栏 + 抽屉菜单或底部导航
```

---

## 18.3 响应式断点

V0.1 不需要复杂设计系统，但需要保证：

- 手机端不横向溢出。
- 编辑页可正常输入。
- 列表可正常滚动。
- 操作按钮适合触摸。

---

## 18.4 基础页面状态

每个列表页面都应考虑：

```text
加载中
空状态
错误状态
有数据状态
```

每个保存操作都应考虑：

```text
保存中
保存成功
保存失败
```

删除操作必须有：

```text
二次确认
```

---

## 19. 权限与安全架构

## 19.1 安全原则

KnowNest 保存的是个人长期知识，因此 V0.1 必须重视数据隔离。

开发期核心原则：

```text
前端保护用户体验
数据库 RLS 保证真正安全
```

生产期如果迁移到腾讯云轻量应用服务器 + 自建 PostgreSQL，安全边界应调整为：

```text
前端保护用户体验
服务端认证校验当前用户
repository / ORM 查询条件强制用户隔离
数据库约束或 PostgreSQL RLS 兜底
```

---

## 19.2 必须启用 RLS 的表

在使用 Supabase 作为开发期数据库时，以下业务表必须启用 RLS：

```text
profiles
knowledge_items
tags
knowledge_item_tags
```

---

## 19.3 权限边界

用户只能：

```text
读取自己的 profile
读取自己的 knowledge_items
创建自己的 knowledge_items
更新自己的 knowledge_items
删除自己的 knowledge_items
读取自己的 tags
创建自己的 tags
更新自己的 tags
删除自己的 tags
管理自己的 knowledge_item_tags
```

---

## 19.4 前端不可信原则

即使前端传入其他用户的 ID，数据库也必须拒绝访问。

不要依赖：

```text
按钮隐藏
前端判断
路由拦截
```

这些只能改善体验，不能作为安全边界。

---

## 20. 环境变量设计

V0.1 开发期连接 Supabase 时需要以下环境变量。

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

后续 AI 版本可能增加：

```text
OPENAI_API_KEY=
AI_MODEL=
EMBEDDING_MODEL=
```

V0.1 不需要 AI 相关环境变量。

如果 Task 02-02 后续选择 ORM / SQL client 或生产期自建 PostgreSQL，应再引入服务端数据库连接变量，例如：

```text
DATABASE_URL=
```

认证阶段可再补充：

```text
AUTH_SECRET=
APP_BASE_URL=
```

V0.1 不实现文件上传，因此不提前加入 Supabase Storage、腾讯云 COS 或 bucket 相关环境变量。

---

## 21. 配置文件建议

## 21.1 `.env.local`

本地开发环境变量。

不提交到 Git。

---

## 21.2 `.env.example`

建议提供示例文件：

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 21.3 `.gitignore`

需要确保忽略：

```text
.env.local
.env*.local
.next
node_modules
```

---

## 22. 开发流程建议

## 22.1 分支策略

个人项目 V0.1 可以采用简单分支策略：

```text
main：稳定版本
dev：日常开发，可选
feature/*：较大的功能开发，可选
```

如果开发节奏较快，可以先直接在 `main` 上开发，但建议每个阶段有清晰 commit。

---

## 22.2 Commit 建议

建议使用清晰提交信息：

```text
feat: add login page
feat: add knowledge item list
feat: add tag input
fix: handle empty knowledge title
docs: add v0.1 architecture
```

---

## 22.3 AI 协作开发方式

建议采用以下流程：

```text
1. 使用产品文档确定需求边界
2. 使用技术架构文档约束实现方式
3. 让 AI 每次只处理一个小任务
4. 每个任务完成后运行检查
5. 人工审查关键代码
6. 再进入下一个任务
```

不要一次性让 AI 实现整个 V0.1。

---

## 23. 开发顺序建议

V0.1 推荐按以下顺序实现。

---

## 23.1 阶段一：项目初始化

目标：项目可以启动。

任务：

```text
创建 Next.js 项目
配置 TypeScript
配置 Tailwind CSS
配置基础目录
配置环境变量
配置开发期 Supabase Client
```

验收：

```text
本地可以启动开发服务器
首页可以正常访问
Supabase Client 可以初始化
Supabase Client 没有被页面或业务组件直接调用
```

---

## 23.2 阶段二：数据库与认证

目标：用户可以登录。

任务：

```text
创建 Supabase 项目
执行数据库初始化 SQL
配置开发期 Supabase Auth
实现登录页
实现退出登录
实现路由保护
```

验收：

```text
用户可以登录
刷新后登录状态保持
退出后回到登录页
未登录不能访问 /app
认证调用集中在 `src/lib/auth`
数据库访问集中在 `src/lib/db`
```

---

## 23.3 阶段三：主布局

目标：登录后有基础应用框架。

任务：

```text
实现 AppShell
实现侧边栏
实现移动端导航
实现 /app 基础页面
实现设置页
```

验收：

```text
登录后进入 /app
可以在主要页面间导航
移动端不严重错乱
```

---

## 23.4 阶段四：知识条目 CRUD

目标：知识库基础闭环完成。

任务：

```text
实现新建知识页
实现知识列表
实现知识详情页
实现编辑保存
实现删除确认
```

验收：

```text
可以创建内容
可以编辑内容
可以删除内容
列表能展示内容
详情页能打开内容
```

---

## 23.5 阶段五：整理字段

目标：支持空间、状态、类型、收藏。

任务：

```text
添加 space 选择
添加 status 选择
添加 type 选择
添加 favorite 按钮
实现 inbox / favorites / archive 页面
```

验收：

```text
内容可以进入收集箱
内容可以被收藏
内容可以被归档
对应页面能正确筛选
```

---

## 23.6 阶段六：标签功能

目标：支持标签管理和标签筛选。

任务：

```text
实现 TagInput
实现标签创建
实现标签绑定
实现标签移除
实现标签筛选
```

验收：

```text
可以给内容添加标签
可以移除标签
标签不会重复创建
可以按标签筛选内容
```

---

## 23.7 阶段七：搜索与筛选

目标：支持基础检索。

任务：

```text
实现关键词搜索
实现空间筛选
实现状态筛选
实现类型筛选
实现收藏筛选
将筛选条件同步到 URL Query
```

验收：

```text
可以按标题搜索
可以按正文搜索
可以组合筛选
刷新页面后筛选条件仍然可见
```

---

## 23.8 阶段八：Markdown 与体验完善

目标：V0.1 可长期基本使用。

任务：

```text
实现 Markdown 预览
优化移动端布局
补充空状态
补充加载状态
补充错误提示
优化保存反馈
```

验收：

```text
Markdown 可以输入和查看
手机浏览器可以正常新建和编辑
主要页面都有基础状态反馈
```

---

## 24. 代码规范建议

## 24.1 TypeScript

原则：

- 业务类型必须显式定义。
- 避免随意使用 `any`。
- 数据库返回值需要转换为领域类型。
- 表单输入和数据库字段要区分。

---

## 24.2 命名规范

文件名：

```text
kebab-case
```

示例：

```text
knowledge-list.tsx
knowledge-editor.tsx
app-sidebar.tsx
```

组件名：

```text
PascalCase
```

示例：

```text
KnowledgeList
KnowledgeEditor
AppSidebar
```

函数名：

```text
camelCase
```

示例：

```text
listKnowledgeItems
createKnowledgeItem
updateItemTags
```

---

## 24.3 组件职责

一个组件只处理一类问题。

避免出现：

```text
一个组件同时处理页面布局、数据查询、表单、标签、删除、搜索全部逻辑
```

推荐拆分：

```text
页面负责组织
组件负责展示和局部交互
数据访问层负责数据库操作
```

---

## 25. 错误处理设计

## 25.1 页面级错误

常见页面级错误：

```text
数据加载失败
知识条目不存在
用户无权限
网络异常
```

处理方式：

- 显示错误提示。
- 提供返回列表按钮。
- 不显示空白页面。

---

## 25.2 表单错误

常见表单错误：

```text
标题和正文同时为空
保存失败
删除失败
标签名为空
来源链接格式异常
```

处理方式：

- 表单附近展示提示。
- 保存按钮恢复可点击。
- 不丢失用户已输入内容。

---

## 25.3 删除确认

删除操作必须二次确认。

确认文案建议：

```text
确定要删除这条知识吗？此操作无法撤销。
```

---

## 26. 加载与空状态设计

## 26.1 加载状态

以下场景需要加载状态：

```text
页面首次加载
列表查询
详情查询
保存中
删除中
登录中
```

---

## 26.2 空状态

以下页面需要空状态：

```text
全部内容为空
收集箱为空
收藏为空
归档为空
搜索无结果
标签筛选无结果
```

空状态应提供下一步操作，例如：

```text
新建第一条知识
清除筛选条件
返回全部内容
```

---

## 27. 性能策略

V0.1 数据量预计较小，因此不需要复杂性能优化。

基础策略：

1. 列表默认按 `updated_at desc` 排序。
2. 列表页可以先不做无限滚动。
3. 如果数据超过一定量，再增加分页。
4. 查询条件尽量使用已有索引字段。
5. Markdown 预览只在详情页渲染，不在列表大量渲染。

---

## 28. 分页策略

V0.1 可以先不做分页。

如果实现成本不高，建议列表默认限制：

```text
每次查询 50 条
```

后续再增加：

```text
加载更多
分页
无限滚动
```

---

## 29. 可测试性要求

V0.1 不强制完整自动化测试，但需要保证关键流程可手动验证。

后续可以逐步加入：

```text
单元测试
组件测试
端到端测试
```

V0.1 手动测试重点：

```text
登录
退出
新建
编辑
删除
收藏
归档
标签
搜索
多设备刷新同步
RLS 数据隔离
移动端使用
```

---

## 30. 日志与监控

V0.1 不要求复杂监控。

本地开发阶段使用：

```text
console.error
Supabase Dashboard（开发期）
Vercel Logs（预览期）
Caddy / 应用日志（生产期）
```

后续如果产品稳定使用，可增加：

```text
错误监控
性能监控
用户行为分析
```

---

## 31. V0.1 不做的技术内容

V0.1 不实现以下内容：

```text
AI API 接入
Embedding
向量检索
RAG
PWA
Capacitor
iOS 原生能力
离线数据库
复杂缓存层
复杂全局状态管理
文件上传
图片上传
PDF 解析
网页抓取
浏览器插件
多人协作权限
公开分享权限
```

---

## 32. 后续扩展预留

## 32.1 AI 辅助整理

后续可以增加：

```text
src/lib/ai/
  summarize.ts
  suggest-tags.ts
  generate-title.ts
```

相关页面入口可以放在知识详情页。

---

## 32.2 知识库问答

后续可以增加：

```text
src/app/app/ask/page.tsx
src/lib/ai/rag.ts
src/lib/db/embeddings.ts
```

并增加数据库表：

```text
knowledge_embeddings
ai_conversations
```

---

## 32.3 PWA / App 化

后续可以增加：

```text
manifest.json
service worker
Capacitor 配置
iOS 分享入口
推送通知
```

但这些不进入 V0.1。

---

## 32.4 附件能力

后续可以增加：

```text
attachments 表
storage adapter
Supabase Storage 或腾讯云 COS provider
图片上传
PDF 上传
文件预览
```

V0.1 不做文件上传，不接入 Supabase Storage 或腾讯云 COS。后续附件能力必须先定义 storage adapter，页面和业务组件不得直接调用具体存储 provider SDK。

---

## 33. 架构验收标准

V0.1 技术架构落地后，应满足：

### 33.1 工程结构

- 项目目录清晰。
- 页面、组件、数据访问层分离。
- Supabase Client 封装在开发期 adapter 边界内。
- 页面和业务组件不直接调用 Supabase SDK。
- 业务常量和类型集中维护。

### 33.2 认证

- 登录流程可用。
- 退出登录可用。
- 未登录不能访问 `/app/**`。
- 登录状态刷新后保持。

### 33.3 数据访问

- 页面和业务组件不直接调用 Supabase SDK、SQL client 或 ORM。
- 核心数据操作封装在 `src/lib/db` 或后续 repository / ORM 层。
- 错误能被抛出并在页面展示。

### 33.4 权限

- 开发期 Supabase RLS 生效。
- 生产期服务端用户隔离策略明确。
- 用户无法访问其他用户数据。
- 前端路由保护和数据库权限都存在。

### 33.5 UI

- 桌面端布局可用。
- 移动端布局可用。
- 核心页面具备加载、空状态、错误状态。

### 33.6 可扩展性

- 后续可以加入 AI 功能。
- 后续可以加入 PWA。
- 后续可以加入 iOS App 包装。
- 后续可以加入向量检索。

---

## 34. 当前结论

KnowNest V0.1 的技术架构应保持简单、清晰、可扩展。

核心路线是：

```text
Next.js + TypeScript + Tailwind CSS
开发期：Supabase Auth + Supabase PostgreSQL + RLS
生产期优先：腾讯云轻量应用服务器 + 自建 PostgreSQL + Caddy / Let's Encrypt
```

核心分层是：

```text
页面层
组件层
数据访问层
认证 / 基础设施 adapter 层
```

核心开发策略是：

```text
先完成认证和数据闭环，
再完成知识 CRUD，
再完成标签、搜索、筛选，
最后完善 Markdown、移动端和基础体验。
```

V0.1 的技术重点不是复杂，而是：

```text
稳定、安全、清晰、能持续迭代。
```
