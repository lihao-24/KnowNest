# 河南高考志愿 AI 助手

面向河南省高考志愿填报的本地优先 Web 问答助手，目标是做一个类似 ChatGPT Web 端的个人顾问工具：通过多轮问答采集考生画像，结合河南省官方招生数据、历年录取数据和可追溯来源，提供张雪峰风格但带明确数据声明的志愿分析。

## 当前阶段

项目已进入 MVP 开发阶段。当前已落地的基础能力：

- Next.js App Router + TypeScript 应用骨架。
- 登录页和受保护三栏工作台 UI。
- Supabase Auth 服务端登录、退出和受保护页面 helper。
- `/api/auth/me`、`/api/chat` 和会话管理服务端接口边界。
- 考生画像提取、招生 CSV 校验导入、冲稳保推荐规则的第一版核心模块和测试。
- OpenAI-compatible Provider 服务端接入和结构化 summary grounding。
- 独立 Postgres schema 初稿、Dockerfile 和 Docker Compose 初稿。

当前最近进度（2026-06-11）：

- 已安装依赖并提交 `pnpm-lock.yaml`。
- 本地开发服务已能启动并打开查看。
- 已新增 browser smoke 脚本：默认 `pnpm smoke:demo` 使用 demo auth + `DATABASE_URL=disabled` 覆盖工作台、问答、右栏联动、志愿篮保存/取消保存和新建/切换会话；真实 Supabase 登录和真实 Provider smoke 均为环境变量门控，缺失时跳过。
- 志愿篮最小闭环已完成：候选卡可保存/取消保存，服务端通过 `saved_choices` repository 和 API 按当前认证用户隔离。
- 右侧考生画像已支持最小手动修正：可编辑分数、位次、科类、国家专项资格、核心诉求、地域偏好和专业兴趣，并按当前会话保存。
- `score_segments` 样例链路已完成：虚构一分一段 CSV parser、导入脚本、repository 和聊天 summary 上下文已接入。
- 已新增 `fixtures/admissions/sample-admission-records.csv`，这是虚构样例数据，只用于端到端开发验证。
- 已新增 `fixtures/admissions/sample-enrollment-plans.csv`，这是虚构当年招生计划样例，只用于计划变化风险验证。
- `/api/chat` 已从 demo 候选改为服务端画像提取、读取 `admission_records`、规则层生成候选、右侧 summary 展示候选的闭环。
- `DATABASE_URL=disabled` 时使用样例 CSV；配置数据库时优先查询 `admission_records`。
- 会话消息和提取出的 candidate profile 已可在数据库可用时按服务端 `user_id` 持久化；工作台支持新建会话、切换会话、恢复消息历史，并按当前 session 续聊。
- OpenAI-compatible Provider 已接入服务端 Chat Completions，模型只接收服务端结构化 summary / 候选 / 来源 / 核验项，并在输出出现未授权候选学校时回退到安全文案。
- `pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build`、`git diff --check` 已通过。
- `pnpm build` 当前显式使用 `next build --webpack`，原因是 Next 16 默认 Turbopack 在当前沙箱环境中会触发端口绑定限制。
- 当前可用体验是 Supabase Auth + 样例数据竖切；还不是完整真实数据驱动 MVP。

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

在 `.env.local` 中填写统一 Supabase Auth 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DEMO_AUTH_ENABLED=false
```

如需启用真实模型回复，继续填写 OpenAI-compatible Provider 配置；不配置时会回落到本地安全 demo 文案：

```env
AI_DEFAULT_PROVIDER=openai-compatible
AI_PROVIDER_BASE_URL=
AI_PROVIDER_API_KEY=
AI_PROVIDER_MODEL=
AI_PROVIDER_TEMPERATURE=0.2
AI_PROVIDER_MAX_TOKENS=900
```

启动本地开发服务：

```bash
pnpm dev
```

浏览器打开 `http://localhost:3000/login`，使用 Supabase Auth 中已有账号登录。

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
pnpm import:score-segments fixtures/admissions/sample-score-segments.csv
```

`fixtures/admissions/sample-admission-records.csv`、`fixtures/admissions/sample-enrollment-plans.csv` 和 `fixtures/admissions/sample-score-segments.csv` 是虚构样例数据，只用于端到端开发验证，不用于真实填报。

常用验证：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm smoke:demo
git diff --check
```

门控 smoke：

```bash
pnpm smoke:supabase
pnpm smoke:provider
```

`pnpm smoke:supabase` 仅在 `E2E_SUPABASE_EMAIL`、`E2E_SUPABASE_PASSWORD`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 都存在时执行真实登录路径，否则跳过。`pnpm smoke:provider` 仅在 OpenAI-compatible Provider 环境变量齐全且 `AI_DEFAULT_PROVIDER=openai-compatible` 时执行，否则跳过。真实账号和密钥只从环境变量读取，不写入代码或日志。

当前仓库不提交 `data-prep/`，该目录由数据整理阶段单独放出。

## 后续接手重点

1. 验证真实 Supabase 登录流程、未登录跳转和登录后服务端 user id。
3. 启动 Postgres，执行 `pnpm db:migrate`，验证会话、消息、画像和多会话切换按 `user_id` 隔离写入。
4. 通过 `pnpm import:admissions fixtures/admissions/sample-admission-records.csv` 和 `pnpm import:enrollment-plans fixtures/admissions/sample-enrollment-plans.csv` 验证样例导入报告和入库。
5. 接入 `score_segments`、`school_documents` 和 RAG 链路，继续细化计划变化、章程限制和风险来源。
6. 用真实 OpenAI-compatible key 做一次门控 smoke，确认模型只解释服务端候选、不新增学校清单。

## Git 状态

该目录按独立项目管理。初始化后请优先保持小步提交，避免把真实密钥、招生原始数据包、运行日志或用户隐私数据提交到仓库。
