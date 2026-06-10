# 认证与存储边界

## 决策

本项目复用个人应用体系中的统一 Supabase Auth，只复用登录身份，不复用其他应用的业务数据。

业务数据使用本项目独立数据库。第一阶段推荐独立 Postgres，并预留后续文档检索和向量能力；如果实现阶段为了极简验证采用 SQLite，仍必须保持同样的用户隔离边界。

## 当前实现状态

截至 2026-06-11：

- 已有 `src/lib/auth/server.ts`：
  - `getCurrentUser()`：优先用 Supabase server client 读取 cookie session。
  - `requireAuthenticatedUser()`：未认证时跳转 `/login`。
  - Supabase 已配置时不再回落到 demo user；`DEMO_AUTH_ENABLED=true` 只在 Supabase 配置缺失时作为本地兜底。
- 已有真实登录/退出入口：
  - `/login`：邮箱密码登录表单，不再展示本地演示入口。
  - `/auth/sign-in`：服务端调用 Supabase Auth 登录并写入 cookie session。
  - `/auth/logout`：服务端退出登录。
- 已有 `/api/auth/me`，返回服务端认证得到的用户，不接受客户端传入 `user_id`。
- 已有 `/api/chat`，接收 `message` 和可选 `sessionId`，`userId` 来自服务端认证结果。
- 已有 `/api/chat/sessions`，按服务端认证用户创建新会话。
- 已有 `/api/chat/sessions/[sessionId]`，按服务端认证用户读取指定会话消息历史和画像 summary。
- 已有 `src/lib/db/client.ts`，`DATABASE_URL=disabled` 时不连接数据库并使用 demo fallback。
- 已有 `src/lib/db/chat-repository.ts`，数据库可用时按 `user_id` 查询/写入聊天会话、消息和 candidate profile；支持按 session 续聊、读取消息历史和创建会话；数据库不可用时降级到 demo sessions / 空消息历史。
- 已有 `src/lib/db/migrations/001_initial.sql`，包含用户私有表、公共招生数据表和 RAG 预留表。
- 本地 Postgres 已通过 `POSTGRES_PORT=55432` 启动，`pnpm db:migrate` 已执行成功。
- `fixtures/admissions/sample-admission-records.csv` 已通过 `pnpm import:admissions` 导入本地 Postgres，`admission_records` 当前样例记录数为 12。

待验证/待完成：

- 真实 Supabase 账号在浏览器中的登录、未登录跳转和退出 smoke 尚待实跑。
- 从浏览器/API 发起真实请求后，聊天消息、画像、多会话切换和用户隔离写入数据库的端到端 smoke 尚未执行。
- `saved_choices` repository 尚未实现。
- 管理员/维护者权限尚未实现，公共招生数据导入仍默认走本地脚本。

## 参考模式

现有 `image-service` 和 `diagram-service` 已采用类似模式：

- Supabase Auth 负责登录和 cookie session。
- 服务端通过 Supabase `auth.getUser()` 获取当前用户。
- 业务数据落在项目自己的数据库中。
- 用户私有表都带 `user_id`。
- API route 中的 `user_id` 只能来自服务端认证结果，不接受客户端传入。

本项目沿用这个身份边界，但业务数据库建议从一开始独立于其他应用。

## 身份与数据关系

```text
统一 Supabase Auth
  -> 本项目服务端校验 session
  -> 得到 auth user id
  -> 写入/读取本项目业务数据库
  -> 所有用户私有数据按 user_id 隔离
```

## 数据分类

### 用户私有数据

必须带 `user_id`：

- 聊天会话。
- 聊天消息。
- 考生画像。
- 志愿篮。
- 用户保存的候选项。
- 用户标注、备注、排除项和偏好。

这些数据只能由当前登录用户访问。服务端查询必须包含当前认证用户的 `user_id` 过滤条件。

### 公共参考数据

通常不带 `user_id`：

- 河南近三年一分一段表。
- 河南近三年本科批投档/录取数据。
- 河南近三年国家专项计划投档/录取数据。
- 当年招生计划。
- 高校招生章程。
- 专业介绍、就业质量报告等公开资料。
- 项目方法论文档和上游精选参考。

公共数据可以被所有已登录用户读取，但导入、更新和删除应限制在管理员或本地维护流程中。

## 服务端边界

- 前端不得传入或覆盖 `user_id`。
- API route 和 server action 必须先校验 Supabase session。
- 用户私有数据的创建、读取、更新、删除，都必须使用服务端认证得到的 `user_id`。
- 模型 Provider API key、数据库连接串和服务端配置不得暴露给浏览器。
- 不使用 Supabase service role key 做普通用户请求。

## 推荐环境变量

认证：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

业务库：

```env
DATABASE_URL=disabled
```

AI Provider：

```env
AI_DEFAULT_PROVIDER=
AI_PROVIDER_BASE_URL=
AI_PROVIDER_API_KEY=
AI_PROVIDER_MODEL=
AI_PROVIDER_TEMPERATURE=0.2
AI_PROVIDER_MAX_TOKENS=900
```

真实密钥和连接串只放本地 `.env.local` 或部署环境，不进入 Git。

## 部署方向

第一阶段推荐：

- Next.js 应用容器。
- 独立 Postgres 容器或外部自托管 Postgres。
- 复用现有 Supabase Auth 实例。
- Docker Compose 本地运行。
- 通过个人域名和反向代理暴露访问。

## 后续可扩展点

- 增加管理员标记，用于限制数据导入和资料维护入口。
- 增加 `pgvector`，将文档 RAG 与结构化数据放在同一个 Postgres。
- 增加统一个人应用入口，但仍保持各应用业务数据隔离。
