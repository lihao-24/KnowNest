# KnowNest 自托管迁移记录

## 当前阶段

- 当前阶段：Mac mini Docker 承接原 Vercel Production。
- 应用公网访问地址统一使用 `APP_URL` / `NEXT_PUBLIC_APP_URL` 配置，不在业务代码或主动运维文档中写死具体生产域名。
- 当前 Docker 生产镜像使用 Next.js `standalone` 输出，并通过 `node server.js` 启动，不使用 `next dev`。
- 生产 compose 文件：`docker-compose.yml`。
- 生产环境变量文件：`.env.production`，不得提交真实密钥。
- 日常运维命令见 `docs/operations/ops-commands.md`。

## 下一阶段

- 下一阶段目标：Supabase Cloud 迁移到 self-hosted Supabase。
- 迁移前先确认目标 Supabase Auth、PostgreSQL、RLS、触发器和业务 migration 的落点。
- 未确认目标数据库前，不执行任何 database migration，不修改线上数据。

## 需要迁移的环境变量

基础应用地址：

```env
APP_URL=
NEXT_PUBLIC_APP_URL=
```

Supabase / 数据库：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
```

AI Provider：

```env
AI_PROVIDER=
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=
AI_MODEL_FAST=
AI_MODEL_DEFAULT=
AI_MODEL_QUALITY=
AI_DAILY_LIMIT=
AI_MAX_INPUT_CHARS=
AI_MIN_INPUT_CHARS=
AI_DEFAULT_MODEL_ID=
AI_MODEL_OPTIONS=
XIAOMI_MIMO_TOKEN_PLAN_API_KEY=
XIAOMI_MIMO_TOKEN_PLAN_BASE_URL=
```

注意：

- `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`NEXT_PUBLIC_APP_URL` 会进入浏览器端构建产物，应只放可公开值。
- `DATABASE_URL`、`DEEPSEEK_API_KEY`、`XIAOMI_MIMO_TOKEN_PLAN_API_KEY` 和其他 Provider 密钥只能作为服务端变量配置。
- `AI_MODEL_OPTIONS` 必须保持为单行 JSON，且只写环境变量名，不写真实 key。
- Docker 构建时需要可公开的 `NEXT_PUBLIC_*` 值；建议使用 `docker compose --env-file .env.production up -d --build`。

## 需要验证的功能清单

- 未登录访问 `/`、`/login`、`/app` 的跳转和登录页加载。
- 登录、退出登录和会话保持。
- 知识条目列表、详情、新建、编辑、删除。
- 收藏、归档、收集箱、生活 / 工作空间筛选。
- 标签新增、筛选和标签名搜索。
- 分类选择、筛选和自定义分类。
- 关键词搜索、组合筛选和排序。
- Markdown 编辑、预览和详情阅读视图。
- AI 摘要、推荐标签、推荐分类、优化标题、整理正文。
- AI 每日限流、失败提示和使用日志写入。
- 移动端核心页面：登录页、列表页、详情页、新建 / 编辑页、设置页。
- 跨用户数据隔离：不能读取、修改、删除其他用户数据。

## 回滚方案

- 应用层回滚：保留上一版 Docker image 或 Git commit，回滚代码后重新构建并启动 `docker-compose.yml`。
- 配置层回滚：保留上一版 `.env.production` 备份，确认没有真实密钥进入 Git，再恢复并重启容器。
- 入口层回滚：如果公网入口或反向代理切换失败，将域名 / 反向代理指回上一稳定服务。
- 数据层回滚：本阶段不执行 migration；后续 Supabase 迁移前必须先准备数据库备份和恢复演练。
- 回滚后执行最小 smoke：`/login` 200、未登录 `/app` 跳转登录、真实账号登录、新建 / 编辑一条测试知识、AI 最小调用。
