# MVP 实施计划

## 目标

把项目从文档阶段推进到可本地运行的 MVP：

- 用户可用统一 Supabase Auth 登录。
- 本项目有独立业务数据库。
- 可以导入河南近三年本科批和国家专项 CSV。
- 可以通过聊天采集考生画像。
- 可以基于结构化数据筛出冲稳保候选。
- 可以用 LLM 做解释、追问和风险提示。
- 可以在右侧展示画像、候选、来源和待核验事项。

## 技术选择

建议：

- Next.js App Router。
- React。
- TypeScript。
- Tailwind CSS。
- Supabase Auth。
- Postgres。
- OpenAI-compatible Provider。
- Docker Compose。

后续可增加：

- `pgvector` 用于文档 RAG。
- Playwright 用于关键页面 smoke。
- 数据导入校验脚本。

## 阶段 0：应用骨架

任务：

- 初始化 Next.js + TypeScript 项目。
- 配置 lint、typecheck、build。
- 创建基础目录。
- 建立 `.env.example`。
- 创建 Dockerfile 和 Docker Compose 初稿。
- 前端布局以 `designs/mvp-ui.pen` 为实现基准。

建议目录：

```text
src/
  app/
  components/
  lib/
    auth/
    db/
    ai/
    profile/
    admissions/
    recommendation/
    rag/
    chat/
  styles/
scripts/
```

验收：

- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm build` 通过。
- 本地 dev server 可打开。

## 阶段 1：统一登录

任务：

- 复用 Supabase Auth。
- 实现登录页。
- 实现服务端 session helper。
- 实现 `requireAuthenticatedUser()`。
- 给受保护页面加鉴权。
- 加一个 `/api/auth/me` 或等价接口用于前端显示当前用户。

边界：

- 只使用 Supabase anon key 和 cookie session。
- 不使用 service role key 处理普通用户请求。
- 不接受客户端传入 `user_id`。

验收：

- 未登录访问工作台跳转登录。
- 登录后进入工作台。
- 服务端能拿到 Supabase user id。

## 阶段 2：业务数据库和 schema

任务：

- 建立独立 Postgres 连接。
- 创建迁移机制。
- 建立基础表。

建议表：

用户私有表：

```text
chat_sessions
chat_messages
candidate_profiles
saved_choices
```

公共数据表：

```text
score_segments
admission_records
enrollment_plans
school_documents
```

RAG 预留表：

```text
document_chunks
```

边界：

- 用户私有表必须带 `user_id`。
- 公共招生数据默认不带 `user_id`。
- 数据访问必须通过 repository/helper。

验收：

- 能创建会话。
- 能保存消息。
- 能保存考生画像。
- 用户 A 看不到用户 B 的私有数据。

## 阶段 3：数据导入

任务：

- 定义 CSV 模板。
- 写导入脚本。
- 做字段校验。
- 做导入报告。

优先导入：

1. `score_segments`。
2. `admission_records` 普通本科批。
3. `admission_records` 国家专项计划。
4. `enrollment_plans` 当年招生计划。

校验项：

- 年份。
- 省份。
- 批次。
- 计划类型。
- 科类或选科。
- 分数和位次数字格式。
- 来源字段。
- 重复记录。

验收：

- 能导入一小份样例 CSV。
- 导入错误能定位到行号和字段。
- 能通过查询接口读到导入数据。

## 阶段 4：考生画像提取

任务：

- 建立画像数据模型。
- 从用户消息中提取分数、位次、科类、国家专项资格、偏好和诉求。
- 支持用户手动修正画像。
- 实现缺失信息判断。

实现建议：

- 先用规则提取硬字段。
- 对兴趣、地域、诉求等软字段，可让 LLM 辅助结构化，但必须给用户确认或可编辑。

验收：

- 输入“河南物理类 580 分，位次 3 万，想省内稳一点”，能识别主要字段；用户说"理科"也能归一化识别。
- 缺少位次时，助手追问位次。
- 右侧画像同步更新。

## 阶段 5：推荐规则服务

任务：

- 根据画像查询候选。
- 按普通本科批和国家专项计划区分。
- 根据国家专项资格过滤。
- 根据位次做初筛。
- 输出冲、稳、保。
- 标记风险。

第一版规则：

- 不照搬上游固定阈值。
- 先用可配置参数。
- 数据不足时返回“无法完整判断”。

建议输出结构：

```text
candidate_id
bucket
school_name
major_name
plan_type
subject_type
city
evidence
risk_tags
missing_sources
```

验收：

- 给定固定画像和样例数据，推荐结果可重复。
- 没有国家专项资格时不返回国家专项候选。
- 缺少招生计划时标记风险，而不是假装完整。

## 阶段 6：LLM 问答编排

任务：

- 配置 OpenAI-compatible Provider。
- 建立 system prompt。
- 将结构化候选、画像、来源和方法论资料传给 LLM。
- 生成自然语言回答。
- 保留数据声明和核验清单。

边界：

- LLM 不直接查询数据库。
- LLM 不直接决定候选。
- LLM 不得编造分数、位次、计划数。
- 回答必须能关联到候选 evidence 和 source。

验收：

- 信息不全时能追问。
- 信息足够时能解释规则层候选。
- 没有数据时明确说明不能判断。

## 阶段 7：工作台 UI

任务：

- 三栏布局。
- 会话列表。
- 聊天主区。
- 右侧画像、缺失信息、候选、来源和风险。
- 保存到志愿篮。

实现基准：

- 登录页和主页视觉参考 `designs/mvp-ui.pen`。
- 登录页保持工具入口风格，不做营销页。
- 主页保持左侧会话、中间问答、右侧总结的三栏结构。
- 右侧总结区必须展示画像、缺失信息、候选清单、数据来源和待核验事项。
- 状态标签需体现 `资料未全`、`待确认`、`待核验`、`可用` 等系统状态。

验收：

- 桌面端可完整使用。
- 窄屏可降级为主聊天 + 抽屉式右侧面板。
- 长回答和候选列表不互相遮挡。

## 阶段 8：Docker 本地部署

任务：

- Dockerfile。
- Docker Compose。
- Postgres volume。
- 环境变量模板。
- 健康检查。

验收：

- `docker compose up -d --build` 可启动。
- 应用可访问。
- Postgres 数据持久化。
- Supabase Auth 配置可用。

## 建议验证命令

实现后应逐步补齐：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

有 UI 后增加：

```bash
pnpm e2e
```

## 风险和取舍

- 河南数据来源可能不是统一格式，导入脚本要允许来源粒度不同。
- 国家专项计划资格由用户声明，系统只能提醒核验，不能替用户判定资格。
- 招生计划和章程可能滞后，推荐必须标记缺失数据。
- LLM 风格要直白但克制，不能为了像张雪峰牺牲可信度和边界。
- 第一版不要做自动爬虫，避免把时间消耗在脆弱解析上。
