# KnowNest V0.1 开发任务拆分文档

## 1. 文档信息

| 项目 | 内容 |
|---|---|
| 产品名称 | KnowNest |
| 中文名 | 知巢 |
| 文档名称 | V0.1 开发任务拆分文档 |
| 建议路径 | `docs/technical/development-plan.md` |
| 文档版本 | v0.1 |
| 适用阶段 | V0.1 MVP |
| 主要目标 | 将 V0.1 拆分为可执行、可验收、适合 AI 协作开发的小任务 |

---

## 2. 文档目标

本文档用于指导 KnowNest V0.1 的实际开发执行。

它的目标不是重复需求文档，而是把需求拆成一系列清晰的小任务，让开发过程可以按照以下方式推进：

```text
阅读需求
  ↓
选择一个小任务
  ↓
交给 Codex / Claude Code 执行
  ↓
本地运行检查
  ↓
人工审查代码
  ↓
提交 Git
  ↓
进入下一个任务
```

---

## 3. 开发前置文档

开发前应优先阅读以下文档：

```text
docs/product-outline.md
docs/requirements/v0.1-mvp.md
docs/technical/database-schema.md
docs/technical/architecture.md
docs/design/page-structure.md
```

本文档依赖以上文档。

---

## 4. V0.1 开发原则

### 4.1 小步提交

每个任务应尽量控制在一个明确范围内。

不要一次性让 AI 实现整个 V0.1。

### 4.2 先跑通主链路

优先完成：

```text
登录 → 进入应用 → 新建知识 → 列表展示 → 编辑知识 → 删除知识
```

标签、搜索、Markdown 预览、移动端优化可以在主链路稳定后再做。

### 4.3 先简单可用，再逐步优化

V0.1 的目标是可用，不是完美。

例如：

```text
Markdown 编辑器可以先用 textarea
搜索可以先用 ilike
标签输入可以先用简单文本输入
移动端先保证不崩，不追求原生体验
```

### 4.4 数据安全不能后置

认证、RLS、用户数据隔离必须尽早完成。

不要先做无权限控制的业务页面，再后补安全逻辑。

### 4.5 每个阶段都要可运行

每完成一个任务，都应该保证：

```text
项目可以启动
TypeScript 不报错
主要页面不崩溃
核心流程可手动验证
```

---

## 5. 总体开发阶段

V0.1 建议拆成 11 个阶段：

```text
Phase 00：开发准备
Phase 01：项目初始化
Phase 02：Supabase 与数据库
Phase 03：认证与路由保护
Phase 04：主布局与导航
Phase 05：知识条目 CRUD 主链路
Phase 06：空间 / 状态 / 类型 / 收藏
Phase 07：标签功能
Phase 08：搜索与筛选
Phase 09：Markdown 编辑与预览
Phase 10：移动端与体验完善
Phase 11：验收、部署与收尾
```

---

## 6. Phase 00：开发准备

## Task 00-01：确认文档和项目目录

### 目标

确保项目文档和目录结构已经准备好。

### 输入文档

```text
docs/product-outline.md
docs/requirements/v0.1-mvp.md
docs/technical/database-schema.md
docs/technical/architecture.md
docs/design/page-structure.md
```

### 任务内容

- 确认 `docs` 目录结构存在。
- 确认核心文档已放入对应位置。
- 确认项目名称为 KnowNest。
- 确认后续技术栈为 Next.js + Supabase。

### 验收标准

- 文档目录结构清晰。
- 需求、数据库、架构、页面结构文档都已存在。

---

## Task 00-02：创建开发 Checklist

### 目标

在项目中创建开发总清单，便于跟踪进度。

### 建议文件

```text
docs/technical/v0.1-checklist.md
```

### 任务内容

- 根据本文档创建简化版开发 Checklist。
- 每个任务使用 checkbox 标记状态。

### 验收标准

- 可以通过 Checklist 快速了解当前开发进度。

---

## 7. Phase 01：项目初始化

## Task 01-01：初始化 Next.js 项目

### 目标

创建 KnowNest 的 Next.js 项目基础结构。

### 任务内容

- 初始化 Next.js 项目。
- 使用 TypeScript。
- 使用 App Router。
- 配置 Tailwind CSS。
- 清理默认模板内容。
- 设置基础首页或重定向逻辑。

### 推荐技术

```text
Next.js
TypeScript
Tailwind CSS
App Router
```

### 验收标准

- 项目可以本地启动。
- 浏览器可以访问本地开发地址。
- TypeScript 编译无明显错误。
- Tailwind CSS 生效。

### 建议提交

```text
chore: initialize nextjs project
```

---

## Task 01-02：创建基础目录结构

### 目标

根据技术架构文档创建基础目录。

### 任务内容

创建以下目录：

```text
src/app
src/components
src/components/layout
src/components/knowledge
src/components/tags
src/components/markdown
src/components/ui
src/lib
src/lib/supabase
src/lib/auth
src/lib/db
src/lib/utils
src/constants
src/types
```

### 验收标准

- 目录结构与技术架构文档基本一致。
- 空目录可以通过 `.gitkeep` 或后续文件保留。

### 建议提交

```text
chore: add project directory structure
```

---

## Task 01-03：配置基础代码规范

### 目标

保证后续代码风格稳定。

### 任务内容

- 确认 ESLint 可用。
- 确认 TypeScript 配置可用。
- 配置路径别名，例如 `@/components`、`@/lib`。
- 创建 `.env.example`。
- 检查 `.gitignore`。

### `.env.example`

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 验收标准

- 路径别名可正常导入。
- `.env.local` 不会被提交。
- 项目 lint 和 build 基础可运行。

### 建议提交

```text
chore: configure project basics
```

---

## 8. Phase 02：Supabase 与数据库

### Phase 02 修订原则

当前开发阶段可以使用 Supabase PostgreSQL、Supabase Auth 和 Supabase Dashboard 提升开发效率。

但 KnowNest 的生产目标是后续部署到腾讯云轻量应用服务器，并优先使用自建 PostgreSQL。因此 Phase 02 需要同时满足：

```text
开发期可连接 Supabase
业务代码不与 Supabase SDK 强绑定
数据库结构尽量保持标准 PostgreSQL 兼容
Supabase RLS / Auth 作为开发期实现细节隔离
后续可以迁移到自建 PostgreSQL + 服务端权限校验
```

约束：

- 页面和业务组件不要直接调用 Supabase SDK。
- 数据库访问必须经过 `src/lib/db` 暴露的函数。
- 认证调用必须经过 `src/lib/auth`，不要在页面中散写 Supabase Auth 调用。
- Supabase 专属 SQL，例如 `auth.users`、`auth.uid()`、RLS policies，应与通用业务表结构分清边界。
- V0.1 暂不实现文件上传，因此不提前接入 Supabase Storage 或腾讯云 COS；后续如做文件能力，必须先设计 storage adapter。

---

## Task 02-00：确认开发与生产架构边界

### 目标

明确当前阶段使用 Supabase 只是开发期方案，避免后续业务代码与 Supabase 强绑定。

### 任务内容

- 确认开发阶段使用 Supabase PostgreSQL。
- 确认生产阶段优先迁移到腾讯云轻量应用服务器 + 自建 PostgreSQL。
- 确认 HTTPS 后续使用 Caddy / Let's Encrypt。
- 确认附件和备份后续可迁移到腾讯云 COS，但 V0.1 不实现文件上传。
- 在架构文档中同步数据库访问层、认证层、存储层的 adapter 边界。

### 验收标准

- 文档明确区分开发期 Supabase 和未来生产环境。
- 文档明确页面和组件不得直接依赖 Supabase SDK。
- 文档明确 Supabase 专属能力需要被封装在 adapter 或服务层内部。

### 建议提交

```text
docs: clarify supabase migration boundary
```

---

## Task 02-01：创建 Supabase 项目并配置环境变量

### 目标

让前端项目可以在开发阶段连接 Supabase。

### 任务内容

- 创建 Supabase 项目。
- 获取 Project URL。
- 获取 anon public key。
- 填写 `.env.local`。
- 创建 Supabase Client。
- 明确 Supabase Client 只放在 `src/lib/supabase`，不在页面、组件或业务逻辑中散用。

### 建议文件

```text
src/lib/supabase/client.ts
src/lib/supabase/server.ts
```

### 验收标准

- 应用可以读取 Supabase 环境变量。
- Supabase Client 可以初始化。
- 缺失环境变量时有明确错误提示。
- 项目中没有硬编码 Supabase URL、anon key、service role key 或 `.env.local` 内容。
- Supabase SDK 依赖没有扩散到页面和业务组件。

### 建议提交

```text
feat: configure supabase client
```

---

## Task 02-02：确定数据库访问方案

### 目标

在进入 CRUD 之前确定数据库访问边界，降低未来从 Supabase PostgreSQL 迁移到自建 PostgreSQL 的成本。

### 任务内容

- 决定 V0.1 数据访问方案：
  - 方案 A：使用 Drizzle / Prisma / `pg` 通过 `DATABASE_URL` 连接 PostgreSQL。
  - 方案 B：短期使用 Supabase SDK，但只允许在 `src/lib/db` 内部调用。
- 当前决策：选择 Drizzle ORM + `pg` + `DATABASE_URL` 作为业务数据库访问方案。
- 如果采用方案 A，补充 `DATABASE_URL` 到 `.env.example`。
- 如果采用方案 B，明确后续迁移时需要替换 `src/lib/db`，页面和组件不受影响。
- 明确所有数据库查询函数必须接收或解析当前用户 ID，不能依赖页面层自行过滤用户数据。

### 建议文件

```text
src/lib/db
.env.example
docs/technical/architecture.md
```

### 验收标准

- 页面和组件只依赖 `src/lib/db` 暴露的函数。
- Supabase SDK、ORM 或 SQL client 不直接出现在页面和业务组件中。
- 未来切换数据库实现时，主要影响范围被控制在 `src/lib/db` 和数据库迁移文件内。
- Supabase SDK 只保留给开发期 Auth 或必要 adapter 封装，不用于页面 / 组件内业务数据访问。

### 建议提交

```text
docs: define database access boundary
```

---

## Task 02-03：创建数据库迁移脚本

### 输入文档

```text
docs/technical/database-schema.md
```

### 目标

创建可版本化、可审计、可复现的数据库 schema 脚本。

### 任务内容

- 将初始化 SQL 落地为独立 migration 或 schema 文件。
- 创建以下表：

```text
profiles
knowledge_items
tags
knowledge_item_tags
```

- 创建 updated_at trigger。
- 创建索引。
- 将 Supabase 专属 SQL 单独标注，例如：
  - `auth.users`
  - `auth.uid()`
  - 新用户 profile trigger
  - RLS policies
- 在 Supabase SQL Editor 中执行当前开发环境所需 SQL。

### 验收标准

- 仓库内存在可执行的数据库初始化 SQL / migration。
- 数据库表创建成功。
- 通用业务表结构尽量保持标准 PostgreSQL 兼容。
- Supabase 专属权限 SQL 有清晰注释，未来迁移时可以定位替换。
- 如果开发期继续使用 Supabase RLS，则 RLS 已启用。
- Supabase Dashboard 中可以看到对应表结构。
- 新用户注册后可以自动生成 profile。

### 建议提交

```text
db: add initial schema migration
```

---

## Task 02-04：修订数据库 schema 的迁移说明

### 目标

让数据库设计同时服务开发期 Supabase 和未来自建 PostgreSQL。

### 任务内容

- 在数据库文档中区分：
  - 通用 PostgreSQL 业务表结构。
  - Supabase Auth / RLS 专属实现。
  - 未来自建 PostgreSQL 的权限实现方向。
- 明确 `profiles` 是业务用户资料表，不应让业务代码直接依赖 Supabase `auth.users`。
- 明确用户隔离在 Supabase 开发期由 RLS 保证；在自建部署中应由服务端认证 + repository 查询条件保证。
- 明确 `pg_trgm` 等扩展是可选搜索优化，不是 Phase 02 必需能力。

### 建议文件

```text
docs/technical/database-schema.md
```

### 验收标准

- 文档能指导开发者区分哪些 SQL 可直接迁移到自建 PostgreSQL，哪些需要替换。
- 文档没有把 Supabase RLS 描述成唯一长期权限模型。

### 建议提交

```text
docs: document database portability notes
```

---

## Task 02-05：定义前端业务类型和常量

### 目标

创建 V0.1 的核心 TypeScript 类型和业务常量。

### 建议文件

```text
src/types/knowledge.ts
src/types/tags.ts
src/constants/knowledge.ts
```

### 任务内容

- 定义 `KnowledgeSpace`。
- 定义 `KnowledgeStatus`。
- 定义 `KnowledgeType`。
- 定义 `KnowledgeItem`。
- 定义 `Tag`。
- 定义 `KnowledgeItemWithTags`。
- 定义空间、状态、类型常量。

### 验收标准

- 类型可以被页面和组件导入。
- 业务常量与数据库 check constraint 保持一致。

### 建议提交

```text
feat: add knowledge types and constants
```

---

## Task 02-06：补充环境变量策略

### 目标

让本地开发、开发数据库和未来生产部署的配置边界更清晰。

### 任务内容

- 保留当前 Supabase 开发变量：

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- 如果 Task 02-02 选择 ORM / SQL client，则补充：

```text
DATABASE_URL=
```

- 认证阶段再补充：

```text
AUTH_SECRET=
APP_BASE_URL=
```

- 生产部署阶段再补充：

```text
CORS_ORIGIN=
```

- V0.1 不提前加入 Storage 配置；等文件上传进入范围时再加入：

```text
STORAGE_PROVIDER=
STORAGE_BUCKET=
```

### 验收标准

- `.env.example` 只包含当前阶段真正需要或即将需要的变量。
- 没有硬编码 Supabase URL、API key、数据库连接串、Bucket name。
- 文档明确 `.env.local` 不提交到 Git。

### 建议提交

```text
chore: document environment variables
```

---

## 9. Phase 03：认证与路由保护

## Task 03-01：实现登录页 UI

### 目标

完成 `/login` 页面的基础 UI。

### 输入文档

```text
docs/design/page-structure.md
```

### 任务内容

- 创建 `/login` 页面。
- 展示 KnowNest 产品名。
- 展示邮箱输入框。
- 展示密码输入框。
- 展示登录按钮。
- 支持 loading 和错误状态的 UI，但可以先不接真实登录。

### 验收标准

- `/login` 可以正常访问。
- 页面在桌面端和移动端都不崩。
- 输入框和按钮可交互。

### 建议提交

```text
feat: add login page ui
```

---

## Task 03-02：接入登录逻辑

### 目标

实现邮箱 + 密码登录。

### 任务内容

- 通过 `src/lib/auth` 封装登录方法。
- 当前开发期可以在 `src/lib/auth` 内部调用 Supabase Auth。
- 登录成功后跳转 `/app`。
- 登录失败时展示错误。
- 登录中禁用按钮。
- 页面不要直接调用 `supabase.auth.*`。

### 验收标准

- 正确账号可以登录。
- 错误账号显示错误提示。
- 登录成功后进入 `/app`。
- 登录实现集中在认证服务层，方便后续替换认证方案。

### 建议提交

```text
feat: implement email password login
```

---

## Task 03-03：实现退出登录

### 目标

让用户可以从设置页或临时入口退出登录。

### 任务内容

- 通过 `src/lib/auth` 封装退出登录方法。
- 当前开发期可以在 `src/lib/auth` 内部调用 Supabase Auth signOut。
- 退出后跳转 `/login`。
- 清除当前会话状态。
- 页面不要直接调用 `supabase.auth.*`。

### 验收标准

- 登录后可以退出。
- 退出后不能继续访问 `/app`。
- 退出登录实现集中在认证服务层。

### 建议提交

```text
feat: implement logout
```

---

## Task 03-04：实现路由保护

### 目标

保护 `/app/**` 页面，未登录用户不能访问。

### 任务内容

- 创建 Next.js middleware 或服务端校验逻辑。
- 未登录访问 `/app/**` 时跳转 `/login`。
- 已登录访问 `/login` 时跳转 `/app`。
- 刷新页面后登录状态保持。

### 验收标准

- 未登录访问 `/app` 会跳转登录页。
- 登录后访问 `/app` 正常。
- 已登录访问 `/login` 会跳转 `/app`。
- 刷新页面不会丢失登录状态。

### 建议提交

```text
feat: add auth route protection
```

---

## 10. Phase 04：主布局与导航

## Task 04-01：实现 AppShell 桌面布局

### 目标

完成登录后页面的基础应用框架。

### 任务内容

- 创建 `/app/layout.tsx`。
- 创建 `AppShell`。
- 创建左侧 Sidebar。
- 创建主内容区。
- 保证 `/app` 页面在布局中渲染。

### 验收标准

- 登录后进入 `/app` 能看到应用布局。
- 左侧导航和右侧内容区清晰。
- 桌面端布局不崩。

### 建议提交

```text
feat: add app shell layout
```

---

## Task 04-02：实现导航项

### 目标

提供 V0.1 的主要导航入口。

### 任务内容

添加导航项：

```text
新建知识
全部内容
收集箱
收藏
归档
生活
工作
设置
```

### 验收标准

- 点击导航可以跳转到对应页面或带 query 的 `/app`。
- 当前页面导航项有高亮状态。

### 建议提交

```text
feat: add app navigation
```

---

## Task 04-03：实现移动端基础导航

### 目标

保证 iPhone 浏览器中可以打开和使用导航。

### 任务内容

- 创建顶部栏。
- 创建移动端抽屉菜单。
- 复用桌面端导航内容。
- 小屏幕隐藏桌面 Sidebar。

### 验收标准

- 移动端不出现横向滚动。
- 可以打开和关闭菜单。
- 可以通过菜单跳转页面。

### 建议提交

```text
feat: add mobile navigation
```

---

## 11. Phase 05：知识条目 CRUD 主链路

## Task 05-01：实现知识数据访问层基础函数

### 目标

封装知识条目的数据库操作。

### 建议文件

```text
src/lib/db/knowledge-items.ts
```

### 任务内容

实现基础函数：

```ts
listKnowledgeItems()
getKnowledgeItemById(id)
createKnowledgeItem(input)
updateKnowledgeItem(id, input)
deleteKnowledgeItem(id)
```

暂时可以不处理标签。

### 验收标准

- 函数调用 Task 02-02 确定的数据访问实现。
- 页面和组件不直接调用 Supabase SDK、ORM 或 SQL client。
- 查询和写入都必须按当前用户隔离数据。
- 错误不会被静默吞掉。
- 返回类型清晰。

### 建议提交

```text
feat: add knowledge item data access functions
```

---

## Task 05-02：实现新建知识页基础版

### 目标

用户可以创建一条知识。

### 任务内容

- 创建 `/app/items/new` 页面。
- 创建标题输入框。
- 创建正文 textarea。
- 创建保存按钮。
- 保存时调用 `createKnowledgeItem`。
- 默认状态为 `inbox`。
- 保存成功后跳转到详情页或 `/app`。

### 验收标准

- 可以创建标题 + 正文内容。
- 可以只输入标题保存。
- 可以只输入正文保存。
- 标题和正文不能同时为空。
- 保存失败有提示。

### 建议提交

```text
feat: add create knowledge item page
```

---

## Task 05-03：实现全部内容列表页基础版

### 目标

用户可以看到自己创建的知识条目。

### 任务内容

- 创建 `/app` 页面。
- 调用 `listKnowledgeItems`。
- 默认展示非归档内容。
- 按更新时间倒序排列。
- 创建 `KnowledgeList` 和 `KnowledgeListItem`。
- 点击列表项进入详情页。

### 验收标准

- 创建内容后可以在列表中看到。
- 刷新页面后数据仍在。
- 只展示当前用户的数据。

### 建议提交

```text
feat: add knowledge item list
```

---

## Task 05-04：实现知识详情 / 编辑页基础版

### 目标

用户可以查看和编辑已有知识。

### 任务内容

- 创建 `/app/items/[id]` 页面。
- 加载单条知识。
- 展示标题和正文。
- 支持修改并保存。
- 保存后更新时间变化。

### 验收标准

- 点击列表项可以进入详情页。
- 可以编辑标题和正文。
- 保存后刷新页面数据仍然正确。
- 不存在的 ID 有错误或空状态。

### 建议提交

```text
feat: add knowledge item detail editor
```

---

## Task 05-05：实现删除知识

### 目标

用户可以删除知识条目。

### 任务内容

- 在详情页添加删除按钮。
- 添加二次确认。
- 删除后跳转 `/app`。

### 删除确认文案

```text
确定要删除这条知识吗？此操作无法撤销。
```

### 验收标准

- 删除前有确认。
- 取消后不删除。
- 确认后删除成功。
- 删除后列表不再展示。

### 建议提交

```text
feat: add delete knowledge item flow
```

---

## 12. Phase 06：空间 / 状态 / 类型 / 收藏

## Task 06-01：在表单中加入空间、状态、类型字段

### 目标

知识条目支持结构化整理字段。

### 任务内容

- 在新建页和编辑页加入 `space`。
- 加入 `status`。
- 加入 `type`。
- 使用 `src/constants/knowledge.ts` 的常量渲染选项。

### 默认值

```text
space = work
type = note
status = inbox
```

### 验收标准

- 新建时可以设置空间、状态、类型。
- 编辑时可以修改空间、状态、类型。
- 保存后列表和详情都正确显示。

### 建议提交

```text
feat: add knowledge metadata fields
```

---

## Task 06-02：实现收藏功能

### 目标

用户可以收藏和取消收藏知识。

### 任务内容

- 在详情页添加收藏按钮。
- 在列表项展示收藏状态。
- 实现 `toggleFavorite`。

### 验收标准

- 点击收藏后状态变化。
- 刷新后收藏状态保持。
- 取消收藏后状态更新。

### 建议提交

```text
feat: add favorite knowledge item
```

---

## Task 06-03：实现收集箱页

### 目标

展示 `status = inbox` 的内容。

### 任务内容

- 创建 `/app/inbox` 页面。
- 查询 `status = inbox` 的知识条目。
- 复用 `KnowledgeList`。
- 添加空状态。

### 验收标准

- 新建默认内容会出现在收集箱。
- 修改状态为 `organized` 后不再出现在收集箱。

### 建议提交

```text
feat: add inbox page
```

---

## Task 06-04：实现收藏页

### 目标

展示收藏内容。

### 任务内容

- 创建 `/app/favorites` 页面。
- 查询 `is_favorite = true` 的知识条目。
- 复用 `KnowledgeList`。
- 添加空状态。

### 验收标准

- 收藏内容出现在收藏页。
- 取消收藏后从收藏页消失。

### 建议提交

```text
feat: add favorites page
```

---

## Task 06-05：实现归档页

### 目标

展示归档内容。

### 任务内容

- 创建 `/app/archive` 页面。
- 查询 `status = archived` 的知识条目。
- 默认 `/app` 不展示归档内容。
- 添加空状态。

### 验收标准

- 状态改为归档后，不再出现在全部内容页。
- 归档内容可以在归档页看到。
- 修改状态为已整理后离开归档页。

### 建议提交

```text
feat: add archive page
```

---

## 13. Phase 07：标签功能

## Task 07-01：实现标签数据访问层

### 目标

封装标签相关数据库操作。

### 建议文件

```text
src/lib/db/tags.ts
```

### 任务内容

实现：

```ts
listTags()
createTag(name)
getOrCreateTags(names)
listTagsByItemId(itemId)
updateItemTags(itemId, tagNames)
```

### 验收标准

- 可以创建标签。
- 同一用户下不会重复创建同名标签。
- 可以查询某条知识的标签。
- 可以更新某条知识的标签绑定。
- 标签数据访问集中在 `src/lib/db/tags.ts`，页面和组件不直接调用 Supabase SDK、ORM 或 SQL client。

### 建议提交

```text
feat: add tag data access functions
```

---

## Task 07-02：实现 TagInput 组件

### 目标

用户可以在表单中输入和删除标签。

### 任务内容

- 创建 `TagInput`。
- 输入标签名后按回车添加。
- 去除前后空格。
- 空标签不添加。
- 重复标签不添加。
- 支持删除已添加标签。

### 验收标准

- 可以添加多个标签。
- 可以删除标签。
- 空标签和重复标签不会出现。

### 建议提交

```text
feat: add tag input component
```

---

## Task 07-03：将标签接入新建和编辑流程

### 目标

知识条目可以保存标签。

### 任务内容

- 新建时保存标签。
- 编辑时加载已有标签。
- 编辑后更新标签绑定。
- 列表项展示标签。

### 验收标准

- 新建知识时添加的标签可以保存。
- 编辑页可以看到已有标签。
- 修改标签后保存生效。
- 列表页展示标签。

### 建议提交

```text
feat: connect tags to knowledge editor
```

---

## Task 07-04：实现标签筛选基础能力

### 目标

用户可以按标签筛选知识条目。

### 任务内容

- 在筛选器中展示已有标签。
- 选择标签后筛选列表。
- URL Query 中保存 tag 参数。

### 验收标准

- 可以选择标签筛选。
- 筛选结果只包含对应标签内容。
- 清除筛选后恢复默认列表。

### 建议提交

```text
feat: add tag filter
```

---

## 14. Phase 08：搜索与筛选

## Task 08-01：实现关键词搜索

### 目标

用户可以搜索标题和正文。

### 任务内容

- 添加搜索框。
- 支持关键词搜索 title 和 content。
- 搜索条件同步到 URL Query。
- 支持清除关键词。

### 验收标准

- 可以搜索标题。
- 可以搜索正文。
- 搜索无结果时有空状态。
- 刷新页面后搜索条件仍可恢复。

### 建议提交

```text
feat: add keyword search
```

---

## Task 08-02：实现空间、状态、类型筛选

### 目标

用户可以按结构化字段筛选内容。

### 任务内容

- 添加空间筛选。
- 添加状态筛选。
- 添加类型筛选。
- 筛选条件同步到 URL Query。
- 与关键词搜索组合。

### 验收标准

- 可以按 `life / work` 筛选。
- 可以按 `inbox / organized / archived` 筛选。
- 可以按内容类型筛选。
- 多条件组合查询正确。

### 建议提交

```text
feat: add metadata filters
```

---

## Task 08-03：实现收藏筛选和清除筛选

### 目标

完善筛选体验。

### 任务内容

- 支持只看收藏。
- 添加清除筛选按钮。
- 筛选器在移动端可折叠。

### 验收标准

- 可以只看收藏内容。
- 清除筛选后回到当前页面默认状态。
- 移动端筛选器不挤占过多空间。

### 建议提交

```text
feat: improve filters and clear state
```

---

## 15. Phase 09：Markdown 编辑与预览

## Task 09-01：实现 MarkdownEditor 组件

### 目标

封装 Markdown 输入组件。

### 任务内容

- 创建 `MarkdownEditor`。
- 内部使用 textarea。
- 支持 value 和 onChange。
- 支持基础 placeholder。
- 适配移动端高度。

### 验收标准

- 新建页和编辑页使用统一编辑器。
- 输入长文本体验正常。
- 移动端可正常输入。

### 建议提交

```text
feat: add markdown editor component
```

---

## Task 09-02：实现 MarkdownPreview 组件

### 目标

支持预览 Markdown 内容。

### 任务内容

- 引入 Markdown 渲染库。
- 创建 `MarkdownPreview`。
- 支持标题、列表、引用、链接、代码块。
- 避免直接执行不可信 HTML。

### 验收标准

- Markdown 可以被正常渲染。
- 代码块、列表、链接显示正常。
- 不执行用户输入的脚本。

### 建议提交

```text
feat: add markdown preview
```

---

## Task 09-03：实现编辑 / 预览切换

### 目标

在表单中支持编辑和预览模式。

### 任务内容

- 添加编辑 / 预览 Tab。
- 编辑模式显示 textarea。
- 预览模式显示 Markdown 渲染结果。

### 验收标准

- 可以在编辑和预览间切换。
- 切换时内容不丢失。
- 移动端表现正常。

### 建议提交

```text
feat: add markdown edit preview tabs
```

---

## 16. Phase 10：移动端与体验完善

## Task 10-01：补齐空状态、加载状态、错误状态

### 目标

让所有核心页面具备基础反馈。

### 任务内容

- 列表加载状态。
- 详情加载状态。
- 空列表状态。
- 搜索无结果状态。
- 保存失败提示。
- 删除失败提示。

### 验收标准

- 页面不出现长时间空白。
- 用户知道当前是加载中、无数据还是出错。

### 建议提交

```text
feat: add loading empty and error states
```

---

## Task 10-02：优化移动端布局

### 目标

保证 iPhone 浏览器可用。

### 任务内容

- 检查登录页。
- 检查列表页。
- 检查新建页。
- 检查编辑页。
- 检查设置页。
- 调整表单和按钮触摸尺寸。
- 避免横向滚动。

### 验收标准

- iPhone 浏览器不横向溢出。
- 列表可滚动。
- 编辑器可输入。
- 保存按钮容易点击。
- 导航可打开和关闭。

### 建议提交

```text
fix: improve mobile layout
```

---

## Task 10-03：完善保存与删除反馈

### 目标

让关键操作反馈清晰。

### 任务内容

- 保存中禁用按钮。
- 保存成功展示提示。
- 保存失败展示错误。
- 删除中禁用按钮。
- 删除失败展示错误。

### 验收标准

- 用户不会重复点击造成混乱。
- 操作成功或失败都有反馈。

### 建议提交

```text
feat: improve save and delete feedback
```

---

## Task 10-04：设置页完善

### 目标

完成 V0.1 设置页。

### 任务内容

- 显示当前用户邮箱。
- 显示版本号 V0.1。
- 提供退出登录按钮。

### 验收标准

- 用户可以看到当前账号。
- 用户可以退出登录。

### 建议提交

```text
feat: add settings page
```

---

## 17. Phase 11：验收、部署与收尾

## Task 11-01：V0.1 功能自测

### 目标

按验收标准完整测试 V0.1。

### 测试清单

```text
登录
退出登录
未登录路由保护
新建知识
编辑知识
删除知识
收藏
取消收藏
归档
恢复归档
收集箱
标签添加
标签删除
标签筛选
关键词搜索
空间筛选
状态筛选
类型筛选
移动端布局
多设备刷新同步
开发期 RLS 数据隔离 / 生产期服务端用户隔离策略
```

### 验收标准

- 核心流程全部通过。
- 没有阻断使用的严重问题。

### 建议提交

```text
test: complete v0.1 manual verification
```

---

## Task 11-02：生产部署准备与上线

### 目标

将 KnowNest V0.1 部署到线上环境，并为后续腾讯云轻量应用服务器部署做好准备。

### 任务内容

- 确认当前上线方式：
  - 临时预览环境可以使用 Vercel。
  - 正式生产环境优先使用腾讯云轻量应用服务器。
- 如果使用腾讯云轻量应用服务器，规划以下服务：
  - app
  - postgres
  - caddy
  - backup job
- 配置生产环境变量。
- 配置 HTTPS，优先使用 Caddy / Let's Encrypt 自动证书。
- 验证线上登录和数据读写。
- 验证数据库备份策略。

### 验收标准

- 线上地址可以访问。
- 可以登录。
- 可以新建、编辑、删除知识。
- 线上环境连接目标数据库正常。
- 如果仍临时使用 Supabase PostgreSQL，需要明确后续迁移计划。
- 如果使用自建 PostgreSQL，需要确认备份和恢复流程。

### 建议提交

```text
chore: prepare production deployment
```

---

## Task 11-03：整理 README

### 目标

让项目具备基础说明。

### 任务内容

更新 `README.md`，包含：

```text
项目介绍
技术栈
本地启动方式
环境变量说明
文档目录说明
V0.1 功能范围
```

### 验收标准

- 新人或未来的自己可以通过 README 理解项目。
- 本地启动步骤清晰。

### 建议提交

```text
docs: update project readme
```

---

## 18. 推荐开发顺序总表

| 顺序 | 任务 | 依赖 | 优先级 |
|---|---|---|---|
| 1 | Task 01-01 初始化项目 | 无 | P0 |
| 2 | Task 01-02 创建目录结构 | 01-01 | P0 |
| 3 | Task 01-03 配置基础规范 | 01-01 | P0 |
| 4 | Task 02-00 确认开发与生产架构边界 | 01-03 | P1 |
| 5 | Task 02-01 配置 Supabase 开发连接 | 02-00 | P0 |
| 6 | Task 02-02 确定数据库访问方案 | 02-00 | P0 |
| 7 | Task 02-03 创建数据库迁移脚本 | 02-02 | P1 |
| 8 | Task 02-04 修订数据库迁移说明 | 02-03 | P1 |
| 9 | Task 02-05 定义类型常量 | 02-03 | P0 |
| 10 | Task 02-06 补充环境变量策略 | 02-02 | P1 |
| 11 | Task 03-01 登录页 UI | 02-01 | P0 |
| 12 | Task 03-02 登录逻辑 | 03-01、02-00 | P0 |
| 13 | Task 03-03 退出登录 | 03-02 | P0 |
| 14 | Task 03-04 路由保护 | 03-02 | P0 |
| 15 | Task 04-01 AppShell | 03-04 | P0 |
| 16 | Task 04-02 导航项 | 04-01 | P0 |
| 17 | Task 05-01 数据访问层 | 02-02、02-05 | P0 |
| 18 | Task 05-02 新建知识 | 05-01 | P0 |
| 19 | Task 05-03 知识列表 | 05-02 | P0 |
| 20 | Task 05-04 详情编辑 | 05-03 | P0 |
| 21 | Task 05-05 删除知识 | 05-04 | P0 |
| 22 | Task 06-01 元信息字段 | 05-04 | P1 |
| 23 | Task 06-02 收藏 | 06-01 | P1 |
| 24 | Task 06-03 收集箱 | 06-01 | P1 |
| 25 | Task 06-04 收藏页 | 06-02 | P1 |
| 26 | Task 06-05 归档页 | 06-01 | P1 |
| 27 | Task 07-01 标签数据层 | 05-04 | P1 |
| 28 | Task 07-02 TagInput | 07-01 | P1 |
| 29 | Task 07-03 标签接入表单 | 07-02 | P1 |
| 30 | Task 07-04 标签筛选 | 07-03 | P1 |
| 31 | Task 08-01 关键词搜索 | 05-03 | P1 |
| 32 | Task 08-02 元信息筛选 | 08-01 | P1 |
| 33 | Task 08-03 收藏筛选 | 08-02 | P2 |
| 34 | Task 09-01 MarkdownEditor | 05-04 | P2 |
| 35 | Task 09-02 MarkdownPreview | 09-01 | P2 |
| 36 | Task 09-03 编辑预览切换 | 09-02 | P2 |
| 37 | Task 04-03 移动端导航 | 04-02 | P2 |
| 38 | Task 10-01 状态反馈 | 核心页面完成后 | P2 |
| 39 | Task 10-02 移动端优化 | 核心页面完成后 | P2 |
| 40 | Task 10-03 操作反馈 | 核心 CRUD 后 | P2 |
| 41 | Task 10-04 设置页完善 | 03-03 | P2 |
| 42 | Task 11-01 功能自测 | 全部功能后 | P0 |
| 43 | Task 11-02 生产部署准备与上线 | 自测通过 | P0 |
| 44 | Task 11-03 README | 部署前后均可 | P2 |

---

## 19. P0 / P1 / P2 范围定义

### P0：必须完成，否则 V0.1 不成立

```text
项目初始化
开发期 Supabase 连接
数据库表
数据库访问边界
认证
路由保护
主布局
知识 CRUD
基础列表
删除
部署
```

### P1：V0.1 核心体验，应尽量完成

```text
空间
状态
类型
数据库迁移脚本
Supabase 解耦约束
生产部署兼容性
收藏
收集箱
归档
标签
搜索
筛选
```

### P2：体验增强，可根据时间决定

```text
Markdown 预览
移动端细节优化
更完整空状态
更好的保存反馈
README 完善
```

---

## 20. 适合交给 AI 的任务粒度

适合一次交给 AI 的任务：

```text
实现登录页 UI
实现 Supabase Client
实现 KnowledgeList 组件
实现 createKnowledgeItem 函数
实现 TagInput 组件
实现收集箱页面
实现 MarkdownPreview 组件
```

不适合一次交给 AI 的任务：

```text
实现整个 V0.1
完成所有页面和数据库
把 KnowNest 全部开发完
同时实现认证、CRUD、标签、搜索和移动端
```

---

## 21. AI 协作提示词模板

## 21.1 通用开发提示词

```text
你现在是 KnowNest 项目的开发助手。

请先阅读以下项目文档：
- docs/product-outline.md
- docs/requirements/v0.1-mvp.md
- docs/technical/database-schema.md
- docs/technical/architecture.md
- docs/design/page-structure.md
- docs/technical/development-plan.md

当前只执行一个任务：{任务编号 + 任务名称}

要求：
1. 严格遵守现有文档中的范围，不要扩展 V0.1 不做的功能。
2. 不要一次性重构无关代码。
3. 优先保持实现简单、清晰、可维护。
4. 修改完成后说明改动文件、实现内容和需要我手动验证的步骤。
5. 如果发现文档和现有代码冲突，先说明冲突，不要擅自扩大范围。
6. 开发期可以使用 Supabase，但页面和业务组件不要直接依赖 Supabase SDK；数据库访问走 `src/lib/db`，认证访问走 `src/lib/auth`。
```

---

## 21.2 代码审查提示词

```text
请审查这次改动是否符合 KnowNest V0.1 的文档约束。

重点检查：
1. 是否超出了当前任务范围。
2. 是否破坏了已有功能。
3. 是否符合 docs/technical/architecture.md 的目录和分层原则。
4. 是否存在明显的类型问题。
5. 是否存在认证或数据权限风险。
6. 是否有可以简化的实现。
7. 是否把 Supabase SDK、Auth 或 Storage API 扩散到了页面、组件或业务逻辑中。

请给出：
- 必须修改的问题
- 建议优化的问题
- 可以暂时接受的问题
```

---

## 21.3 Bug 修复提示词

```text
KnowNest 当前出现一个 Bug：

现象：{描述现象}
复现步骤：{描述步骤}
预期行为：{描述预期}
实际行为：{描述实际}
相关文件：{如果知道则列出}

请只修复这个 Bug，不要重构无关代码。
修复后请说明原因、改动文件和验证方式。
```

---

## 22. 每个任务完成后的检查清单

每完成一个任务，应检查：

```text
[ ] 项目能正常启动
[ ] 页面不崩溃
[ ] TypeScript 无明显错误
[ ] 相关功能可以手动验证
[ ] 没有引入 V0.1 不做的功能
[ ] 没有明显破坏已有功能
[ ] 关键错误有提示
[ ] 已提交 Git
```

---

## 23. V0.1 最小可发布标准

即使部分 P2 任务没有完成，只要满足以下标准，也可以视为 V0.1 可发布。

```text
用户可以登录
用户可以退出登录
未登录不能访问主应用
用户只能看到自己的数据
用户可以新建知识
用户可以编辑知识
用户可以删除知识
用户可以查看知识列表
用户可以设置空间、状态、类型
用户可以收藏和归档
用户可以添加标签
用户可以搜索标题和正文
用户可以在 Mac 和 iPhone 浏览器中基本使用
数据可以在多设备刷新后同步
```

---

## 24. V0.1 不应临时加入的需求

开发过程中不要临时加入以下内容：

```text
AI 总结
AI 问答
向量检索
PWA
Capacitor
iOS App
文件上传
图片上传
PDF 解析
网页抓取
知识图谱
双链
版本历史
回收站
多人协作
公开分享
任务管理
日历
提醒
```

如果开发过程中想到这些需求，应记录到后续版本想法中，不进入 V0.1。

---

## 25. 建议 Git 提交节奏

每个任务至少一个 commit。

示例：

```text
chore: initialize nextjs project
feat: configure supabase client
feat: implement email password login
feat: add app shell layout
feat: add knowledge item crud
feat: add tags support
feat: add search filters
fix: improve mobile layout
```

提交信息应说明“做了什么”，不要使用模糊信息，例如：

```text
update
fix
change files
wip
```

---

## 26. 当前结论

KnowNest V0.1 的开发应按照“小步推进、主链路优先、安全前置、体验后补”的方式执行。

最重要的开发顺序是：

```text
项目初始化
  ↓
Supabase 和数据库
  ↓
认证和路由保护
  ↓
主布局
  ↓
知识 CRUD
  ↓
空间 / 状态 / 类型 / 收藏
  ↓
标签
  ↓
搜索和筛选
  ↓
Markdown 和体验优化
  ↓
部署验收
```

V0.1 的最终目标不是功能丰富，而是先形成一个真正可用的个人知识库底座。

只要这个底座稳定，后续的 AI 辅助整理、知识库问答、PWA 和 iOS App 化都可以在此基础上继续迭代。
