# KnowNest 工作流状态

## 当前模式

- 主控窗口生成任务提示词，后续可切自动调度。
- 当前文件用于主控窗口和 subagent 快速判断阶段、约束、下一步任务。

## 当前阶段进度

- Phase 01：已完成并通过大节点审核。
- Phase 02：已按新版拆分完成到 Task 02-06，并通过大节点审核。
- Phase 03：已完成到 Task 03-04，并通过大节点审核。
- 下一步：进入 Phase 04。

## 已完成阶段和任务

- Phase 01 项目初始化：已完成。
- Phase 02 Supabase 与数据库：新版 Task 02-00 至 Task 02-06 已完成。
- Phase 03 认证与路由保护：Task 03-01 至 Task 03-04 已完成并审核通过。

## 最新关键技术决策

- V0.1 先做 Web App，后续再考虑 PWA、iOS App 和 AI 能力。
- 开发期可使用 Supabase PostgreSQL 与 Supabase Auth。
- 生产期优先腾讯云轻量应用服务器 + 自建 PostgreSQL。
- 业务数据访问方案采用 Drizzle ORM + `pg` + `DATABASE_URL`。
- Supabase RLS 是开发期安全兜底，服务端 repository 仍必须按当前用户过滤数据。
- `profiles.id` 是业务层用户主键；业务代码不要直接依赖 `auth.users`。
- 标签采用 `tags` + `knowledge_item_tags` 关系表，不使用字符串数组落库。

## 当前约束

- 页面和业务组件不得直接调用 Supabase SDK。
- 数据库访问走 `src/lib/db`。
- 认证访问走 `src/lib/auth`。
- 页面和业务组件不得直接调用 `supabase.auth.*`。
- 页面和业务组件不得直接调用 SQL client 或 ORM。
- 业务访问必须显式保证当前用户数据隔离。
- 真实环境变量只放在不提交的 `.env.local`。
- 源码和文档示例不得硬编码 Supabase URL、Supabase API key、`DATABASE_URL`、Storage bucket 或 provider 配置。
- V0.1 不做 AI、PWA、Storage、上传、iOS App。
- V0.1 不做多人协作、公开分享、知识图谱、双链、版本历史、回收站。

## 下一个建议任务

- Phase 04 首个任务建议为 Task 04-01：实现 AppShell 桌面布局。

## 大节点审核记录

| 节点 | 状态 | 备注 |
|---|---|---|
| Phase 01 | 已审核通过 | 项目初始化完成。 |
| Phase 02 | 已审核通过 | 新版拆分至 Task 02-06 已完成。 |
| Phase 03 | 已审核通过 | Task 03-01 至 Task 03-04 已完成。 |

## 未决问题 / 风险

- 后续实现主布局和业务页面时，需要持续检查 Supabase SDK 是否扩散到页面或业务组件。
- 后续 CRUD 阶段必须验证 `src/lib/db` 内的用户隔离，不能只依赖前端路由保护。
