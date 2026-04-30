# KnowNest

KnowNest（知巢）是一个面向个人长期使用的知识库 Web App，用于沉淀生活和工作中的笔记、资料、Prompt、项目经验、链接、复盘和计划。

V0.1 的目标是先完成一个稳定、可同步、可真实使用的基础版：用户可以登录账号，在浏览器设备上创建、编辑、整理、搜索并同步自己的知识条目。V0.2 在此基础上增强知识管理体验，补齐分类、标签搜索、筛选排序和详情阅读能力。AI、PWA、移动端原生 App、文件上传等能力不在当前范围内。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth（开发期认证）
- PostgreSQL（开发期可用 Supabase PostgreSQL）
- Drizzle ORM + `pg`
- `react-markdown`

业务数据访问统一经过 `src/lib/db`，认证能力统一经过 `src/lib/auth`。页面和业务组件不要直接访问 Supabase SDK、SQL client 或 ORM。

## 本地启动

1. 安装依赖：

```bash
npm install
```

2. 创建本地环境变量文件：

```bash
touch .env.local
```

填入下方环境变量。若后续补充了 `.env.example`，也可以复制示例文件后再填写真实值。

3. 启动开发服务器：

```bash
npm run dev
```

4. 打开浏览器访问：

```text
http://localhost:3000
```

常用检查命令：

```bash
npm run lint
npm run build
npm run test:auth
npm run test:categories
npm run test:knowledge-items
npm run test:tags
```

## 环境变量

本地真实值只放在 `.env.local`，不要提交到 Git，也不要写入文档示例。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
```

说明：

- `NEXT_PUBLIC_SUPABASE_URL`：开发期 Supabase 项目 URL，用于认证客户端和服务端客户端初始化。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：开发期 Supabase 匿名 key，用于 Supabase Auth。
- `DATABASE_URL`：服务端 PostgreSQL 连接串，供 `src/lib/db` 内部通过 Drizzle ORM + `pg` 访问业务数据。

V0.1 不配置 Supabase Storage、腾讯云 COS、AI provider key 或向量数据库环境变量。

## 新增 AI 模型服务

V0.3 的 AI 调用走服务端 allowlist。前端设置页只展示服务端公开的模型清单，用户选择后只把 `modelId` 保存到浏览器 `localStorage`，不会保存到数据库，也不会暴露 API Key、Base URL 或 `apiKeyEnv`。

当前代码支持 `openai-compatible` 协议的模型服务。新增这类服务时，不需要改前端代码，只需要在 `.env.local` 或部署环境变量中增加服务商配置，并把模型加入 `AI_MODEL_OPTIONS`。

示例：增加 OpenRouter 模型服务。

```env
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

然后把服务加入 `AI_MODEL_OPTIONS`。注意 `AI_MODEL_OPTIONS` 必须保持为单行 JSON，确保 dotenv / Next 可以正确解析。

```env
AI_MODEL_OPTIONS=[{"id":"deepseek-default","label":"DeepSeek 默认","provider":"openai-compatible","baseUrl":"https://api.deepseek.com","apiKeyEnv":"DEEPSEEK_API_KEY","model":"deepseek-v4-flash"},{"id":"xiaomi-mimo-token-plan-pro","label":"Xiaomi MiMo Token Plan Pro","provider":"openai-compatible","baseUrlEnv":"XIAOMI_MIMO_TOKEN_PLAN_BASE_URL","apiKeyEnv":"XIAOMI_MIMO_TOKEN_PLAN_API_KEY","model":"mimo-v2-pro"},{"id":"openrouter-qwen","label":"OpenRouter Qwen","provider":"openai-compatible","baseUrlEnv":"OPENROUTER_BASE_URL","apiKeyEnv":"OPENROUTER_API_KEY","model":"qwen/qwen3-coder"}]
```

模型选项字段说明：

- `id`：模型选项 ID，必须唯一；前端只会保存和发送这个 ID。
- `label`：设置页展示名称。
- `provider`：当前只能是 `openai-compatible`。
- `baseUrlEnv`：服务端 endpoint 环境变量名，推荐使用，避免把 endpoint 直接写进模型清单。
- `baseUrl`：可选，直接写服务端 endpoint；DeepSeek 默认示例使用这个字段。
- `apiKeyEnv`：服务端 API Key 环境变量名，不能写真实 key。
- `model`：传给模型服务的真实模型名。

增加 Xiaomi MiMo Token Plan 时，应使用：

```env
XIAOMI_MIMO_TOKEN_PLAN_API_KEY=
XIAOMI_MIMO_TOKEN_PLAN_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
```

并在模型选项中使用 `baseUrlEnv: "XIAOMI_MIMO_TOKEN_PLAN_BASE_URL"`。这里应填写 Token Plan endpoint，不要填写普通 MiMo API endpoint。

修改 `.env.local` 后需要重启 dev server。若设置页仍只显示 DeepSeek，通常是 `AI_MODEL_OPTIONS` 未配置或 JSON 格式错误；若设置页显示模型但调用失败，通常是对应的 `apiKeyEnv` 或 `baseUrlEnv` 没有配置正确。

如果要接入不兼容 OpenAI Chat Completions API 的服务，例如原生 Claude / Gemini 协议，需要新增 provider 实现、扩展 provider factory 和配置校验，并补充对应测试，不能只改环境变量。

## 文档目录

核心文档位于 `docs/`：

```text
docs/product-outline.md              产品总纲
docs/requirements/v0.1-mvp.md        V0.1 MVP 需求
docs/design/page-structure.md        页面结构与交互
docs/technical/architecture.md       技术架构
docs/technical/database-schema.md    数据库设计
docs/technical/development_plan.md   开发任务拆分
docs/technical/agent-context.md      AI 协作上下文
docs/technical/workflow-status.md    当前阶段状态
docs/technical/v0.1-self-test.md     V0.1 自测记录
```

开始新任务前，优先阅读 `docs/technical/agent-context.md` 和当前任务对应的技术 / 需求文档。

## V0.2 功能范围

V0.2 包含：

- 分类系统：默认分类 + 用户自定义分类，知识条目可选择或编辑分类
- 搜索增强：列表页支持按标题、正文和标签名称搜索
- 筛选增强：列表页支持标签、分类、空间、状态、类型、收藏组合筛选
- 排序增强：支持最近更新、最近创建、最早创建，默认最近更新
- 列表展示：知识卡片展示分类、标签、摘要、收藏状态和更新时间
- 详情页：`/app/items/[id]` 提供 Markdown 阅读视图、标签/分类、创建和更新时间、返回与编辑入口
- 编辑页：`/app/items/[id]/edit` 继续提供标题、正文、标签、分类和元信息编辑
- 数据权限：新增 `categories` 表 RLS，业务查询继续在 `src/lib/db` 强制带 `user_id`

新增数据库迁移：

```text
db/migrations/0002_categories_search_sort.sql
```

部署或本地验证 V0.2 前，需要在目标 PostgreSQL/Supabase 数据库执行该 migration。

## V0.1 功能范围

V0.1 包含：

- 用户登录、退出登录、会话保持和 `/app/**` 路由保护
- 知识条目列表、详情、新建、编辑、删除
- 收集箱、生活 / 工作空间、内容类型、状态、收藏和归档
- 标签添加、删除和标签筛选
- 标题 / 正文基础搜索
- 空间、状态、类型、收藏等基础筛选
- Markdown 输入与基础预览
- 桌面端和 iPhone 浏览器基础响应式布局
- 服务端用户数据隔离；开发期配合 Supabase RLS 作为安全兜底

V0.1 明确不做：

- AI 总结、AI 问答、AI 自动标签、Embedding、向量检索
- PWA、iOS App、浏览器插件、系统分享入口
- 文件 / 图片 / PDF 上传或网页全文抓取
- 多人协作、公开分享、评论、团队空间
- 块编辑器、知识图谱、双链、版本历史、回收站
- 任务管理、日历、提醒、习惯打卡

## 数据与部署边界

- 开发期可以使用 Supabase Auth + Supabase PostgreSQL。
- 业务数据访问使用 Drizzle ORM + `pg` + `DATABASE_URL`。
- 生产期目标优先考虑腾讯云轻量应用服务器 + 自建 PostgreSQL + Caddy / Let's Encrypt。
- 从 Supabase PostgreSQL 迁移到自建 PostgreSQL 时，应尽量把改动限制在数据库连接、迁移和 `src/lib/db` 内部实现。

## 项目结构

```text
src/app                 Next.js 页面、路由和布局
src/components/layout   应用外壳、侧边栏、移动端导航
src/components/knowledge 知识列表、搜索、筛选和条目展示
src/components/tags     标签输入和筛选
src/components/markdown Markdown 编辑与预览
src/lib/auth            认证边界
src/lib/db              数据访问边界
src/lib/supabase        开发期 Supabase adapter
src/types               业务类型
src/constants           业务常量
db/migrations           数据库迁移 SQL
```

## 当前状态

V0.1 已完成。Phase 11 真实账号端到端手测已由用户确认通过，自动化验证已通过；详情见 `docs/technical/workflow-status.md` 和 `docs/technical/v0.1-self-test.md`。
