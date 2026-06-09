# AGENTS.md

## 项目定位

本项目是面向河南省高考志愿填报的本地优先 AI 问答助手。目标形态是类似 ChatGPT 的 Web 端，通过多轮对话采集考生信息，并基于河南省官方数据、历年录取数据、招生章程和专业选科要求，给出可追溯、带风险说明的志愿分析。

项目会参考 `ziqihe10-droid/xuefeng-agent` 的咨询流程和张雪峰风格表达，但不得把其 `knowledge_base.md` 视为可信招生数据源。

默认使用中文沟通和撰写项目文档。

## 首读入口

处理任务前优先阅读：

1. `README.md`
2. `docs/README.md`
3. `docs/specs/initial-product-scope.md`
4. `docs/specs/mvp-product-design.md`
5. `docs/plans/2026-06-09-mvp-implementation-plan.md`
6. `docs/reference/architecture.md`
7. `docs/reference/auth-and-storage.md`
8. `docs/reference/data-and-recommendation.md`
9. `docs/reference/data-preparation-checklist.md`
10. `docs/reference/data-trust-model.md`

前端页面实现前还必须查看 `designs/mvp-ui.pen`。这是当前 MVP 登录页和三栏工作台的 UI 基准。

## 当前目录

```text
.
├── AGENTS.md
├── README.md
├── designs/
│   └── mvp-ui.pen
└── docs/
    ├── README.md
    ├── reference/
    │   ├── architecture.md
    │   ├── auth-and-storage.md
    │   ├── data-and-recommendation.md
    │   ├── data-preparation-checklist.md
    │   ├── data-trust-model.md
    │   └── upstream/
    ├── plans/
    │   └── 2026-06-09-mvp-implementation-plan.md
    └── specs/
        ├── initial-product-scope.md
        └── mvp-product-design.md
```

业务代码已开始创建。当前主要目录：

```text
.
├── src/
│   ├── app/          # Next.js App Router 页面与 API routes
│   ├── components/   # 登录页、工作台和通用展示组件
│   ├── lib/          # auth/db/ai/profile/admissions/recommendation/chat/rag
│   └── styles/
├── public/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── docs/
```

`data-prep/` 当前仍用于本地数据整理，用户明确放出前不要提交到 Git。

## 当前实现状态

截至 2026-06-09，项目已有可本地运行的 MVP 骨架：

- Next.js App Router + React + TypeScript。
- 登录页和 `/workspace` 三栏工作台。
- demo auth + Supabase Auth server helper。
- `/api/auth/me` 和 `/api/chat`。
- `src/lib/profile`、`src/lib/admissions`、`src/lib/recommendation` 的第一版核心规则与测试。
- `src/lib/db` 的 Postgres 连接、迁移、会话 repository 初稿。
- `scripts/migrate.ts` 和 `scripts/import-admissions.ts`。
- `Dockerfile` 和 `docker-compose.yml` 初稿。

当前仍是 demo 数据竖切，未完成真实 Supabase 登录、真实 Postgres 端到端验证、河南招生样例 CSV 入库、数据库驱动推荐和真实 LLM Provider 调用。

## UI 实现基准

- 当前 UI 设计文件：`designs/mvp-ui.pen`。
- 覆盖页面：登录页、主页/志愿问答工作台。
- 主页采用三栏结构：左侧会话列表、中间问答区、右侧当前总结区。
- 后续实现登录页和主页时，应优先贴近该设计的布局、信息层级、状态标签和克制的工作台风格。
- 如因响应式、组件复用或技术限制需要偏离设计，必须在对应实现说明或文档中记录原因。
- 设计文件更新后，需要同步检查 `docs/specs/mvp-product-design.md` 是否仍一致。

## 架构边界

- AI 层负责追问、解释、对比、生成候选理由和风险提示。
- 数据层负责河南省招生计划、历年投档/录取数据、一分一段表、招生章程、选科要求等可追溯资料。
- 规则层负责河南省志愿单位、批次、冲稳保、选科限制、调剂风险和特殊类型过滤。
- 前端层负责类 ChatGPT 对话、志愿篮、对比视图、来源标注和导出。

不要让前端直接调用模型 Provider。模型密钥、检索逻辑和数据查询必须在服务端边界内完成。

## 数据和安全规则

- **科类口径**：`subject_type` 统一使用河南新高考官方口径 `物理类` / `历史类`。
  - 用户口语"理科 / 文科"在画像解析层归一化到 `物理类 / 历史类`。
  - 数据采集、AI 回复、前端展示、志愿篮默认使用官方口径；如确需照顾老高考考生，再补口语化解释。
  - 完整约定见 `docs/reference/data-and-recommendation.md` 的"字段口径约定"一节。
- **批次口径**：河南新高考下传统一本/二本合并为 `本科批`，专科批单列。
- 不提交真实 API Key、Cookie、账号、数据库连接串或任何个人隐私信息。
- 不提交未经脱敏的考生个人信息、家庭信息、联系方式、身份证号、准考证号。
- 招生数据必须标注来源、年份、适用省份、批次和可信等级。
- AI 输出必须区分官方事实、往年趋势、经验判断和模型推测。
- 涉及录取概率或冲稳保时，必须优先引用河南省官方数据或高校官方数据。

## 验证命令

当前应用骨架生成后，优先使用：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

最近一次完整验证结果：

- `pnpm test`：通过，5 个测试文件、10 个测试。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。

注意：`pnpm build` 当前使用 `next build --webpack`。Next 16 默认 Turbopack 在当前沙箱环境中处理 CSS 时曾触发 `binding to a port` 权限错误，因此先显式使用 webpack 构建。

## 文档更新触发器

完成变更前检查是否需要更新文档：

- 修改项目定位、目录结构、模块职责或架构边界时，更新 `AGENTS.md`。
- 修改文档入口、目录状态或历史资料状态时，更新 `docs/README.md`。
- 修改长期有效的数据可信度、数据来源、存储、安全、部署、验证规则时，更新 `docs/reference/`。
- 修改安装、运行、部署或环境变量时，更新 `README.md` 和 `.env.example`。
- 新增阶段性产品范围、实施计划或验证报告时，分别放入 `docs/specs/`、`docs/plans/` 或 `docs/reports/`。

不要为了局部文案、样式微调或测试内部重构更新文档，除非发现现有文档已经误导后续工作。
