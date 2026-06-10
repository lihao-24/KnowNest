# 河南高考志愿 AI 助手

面向河南省高考志愿填报的本地优先 Web 问答助手，目标是做一个类似 ChatGPT Web 端的个人顾问工具：通过多轮问答采集考生画像，结合河南省官方招生数据、历年录取数据和可追溯来源，提供张雪峰风格但带明确数据声明的志愿分析。

## 当前阶段

项目已进入 MVP 开发阶段。当前已落地的基础能力：

- Next.js App Router + TypeScript 应用骨架。
- 登录页和受保护三栏工作台 UI。
- Supabase Auth 服务端 helper，并提供本地 demo auth 方便开发。
- `/api/auth/me` 和 `/api/chat` 服务端接口边界。
- 考生画像提取、招生 CSV 校验导入、冲稳保推荐规则的第一版核心模块和测试。
- 独立 Postgres schema 初稿、Dockerfile 和 Docker Compose 初稿。

当前最近进度（2026-06-10）：

- 已安装依赖并提交 `pnpm-lock.yaml`。
- 本地开发服务已能启动并打开查看。
- 已新增 `fixtures/admissions/sample-admission-records.csv`，这是虚构样例数据，只用于端到端开发验证。
- 已新增 `fixtures/admissions/sample-enrollment-plans.csv`，这是虚构当年招生计划样例，只用于计划变化风险验证。
- `/api/chat` 已从 demo 候选改为服务端画像提取、读取 `admission_records`、规则层生成候选、右侧 summary 展示候选的闭环。
- `DATABASE_URL=disabled` 时使用样例 CSV；配置数据库时优先查询 `admission_records`。
- 会话消息和提取出的 candidate profile 已可在数据库可用时按服务端 `user_id` 持久化。
- `pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build`、`git diff --check` 已通过。
- `pnpm build` 当前显式使用 `next build --webpack`，原因是 Next 16 默认 Turbopack 在当前沙箱环境中会触发端口绑定限制。
- 当前可用体验仍是 demo auth + 样例数据竖切；还不是完整真实数据驱动 MVP。

当前已确定的边界：

- 只服务河南省高考志愿填报，不做全国通用版本。
- 第一阶段优先做本地运行，后续通过个人域名暴露访问。
- AI 负责追问、解释、对比和风险提示，不直接替代官方填报系统。
- 录取概率、冲稳保和专业组判断必须基于可追溯数据，不能只依赖模型常识或网络传闻。
- 项目会参考 `ziqihe10-droid/xuefeng-agent` 的咨询流程和表达风格，但不复用其知识库作为可信数据源。

## 计划中的核心能力

- 类 ChatGPT 的 Web 对话界面
- 河南考生画像采集：科类/选科、分数、位次、兴趣、地域、家庭资源、就业诉求
- 河南省志愿规则说明与追问
- 学校、专业、城市、就业路径对比
- 冲稳保候选清单和风险标签
- 志愿篮、收藏和导出
- 数据来源、年份、可信等级标注

## 建议技术方向

当前推荐方向：

- Next.js App Router + React + TypeScript
- 复用统一 Supabase Auth 做登录
- 独立 Postgres 业务库，预留后续 `pgvector`
- Docker Compose 本地运行，后续通过个人域名暴露
- OpenAI-compatible Provider 作为服务端 AI 模型接口
- 第一版数据从 CSV/Excel 人工整理后导入

## 文档入口

- `AGENTS.md`：agent 工作规范、项目边界和验证规则
- `docs/README.md`：文档目录入口
- `designs/mvp-ui.pen`：当前 MVP 登录页和三栏工作台 UI 基准
- `docs/specs/initial-product-scope.md`：初始产品范围
- `docs/specs/mvp-product-design.md`：MVP 产品与交互设计
- `docs/plans/2026-06-09-mvp-implementation-plan.md`：MVP 开发实施计划
- `docs/reference/architecture.md`：双层 RAG、规则筛选和模块边界
- `docs/reference/auth-and-storage.md`：统一登录与独立业务库边界
- `docs/reference/data-preparation-checklist.md`：河南数据准备清单
- `docs/reference/data-trust-model.md`：数据可信度分级和使用原则

## 本地运行

先安装依赖：

```bash
pnpm install
```

复制环境变量模板：

```bash
cp .env.example .env.local
```

本地开发默认可使用 `DEMO_AUTH_ENABLED=true` 进入工作台：

```bash
pnpm dev
```

浏览器打开 `http://localhost:3000`。

Docker 本地启动：

```bash
docker compose up -d --build
```

如果本机 `5432` 已被其他 Postgres 或 Supabase 占用，可以临时改用其他宿主机端口：

```bash
POSTGRES_PORT=55432 docker compose up -d db
```

如果要连接本地 Postgres，把 `.env.local` 中的 `DATABASE_URL` 改成：

```env
DATABASE_URL=postgres://henan_gaokao:henan_gaokao@localhost:5432/henan_gaokao
```

对应使用 `POSTGRES_PORT=55432` 时：

```env
DATABASE_URL=postgres://henan_gaokao:henan_gaokao@localhost:55432/henan_gaokao
```

执行迁移和导入可提交样例数据：

```bash
pnpm db:migrate
pnpm import:admissions fixtures/admissions/sample-admission-records.csv
pnpm import:enrollment-plans fixtures/admissions/sample-enrollment-plans.csv
```

`fixtures/admissions/sample-admission-records.csv` 和 `fixtures/admissions/sample-enrollment-plans.csv` 是虚构样例数据，只用于端到端开发验证，不用于真实填报。

常用验证：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

当前仓库不提交 `data-prep/`，该目录由数据整理阶段单独放出。

## 后续接手重点

1. 接入真实 Supabase 登录流程，验证未登录跳转和登录后服务端 user id。
2. 启动 Postgres，执行 `pnpm db:migrate`，验证会话、消息和画像按 `user_id` 隔离写入。
3. 通过 `pnpm import:admissions fixtures/admissions/sample-admission-records.csv` 验证样例导入报告和入库。
4. 通过 `pnpm import:enrollment-plans fixtures/admissions/sample-enrollment-plans.csv` 验证当年招生计划样例导入，并继续细化计划变化风险。
5. 接入 OpenAI-compatible Provider，保持 LLM 只解释规则层候选、不直接决定候选。
6. 做一次浏览器/窄屏 UI smoke，确认三栏、长回答和右侧总结区不遮挡。

## Git 状态

该目录按独立项目管理。初始化后请优先保持小步提交，避免把真实密钥、招生原始数据包、运行日志或用户隐私数据提交到仓库。
