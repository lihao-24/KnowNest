# KnowNest 工作流状态

## 当前模式

- 主控窗口生成任务提示词，后续可切自动调度。
- 当前文件用于主控窗口和 subagent 快速判断阶段、约束、下一步任务。

## 当前阶段进度

- Phase 01：已完成并通过大节点审核。
- Phase 02：已按新版拆分完成到 Task 02-06，并通过大节点审核。
- Phase 03：已完成到 Task 03-04，并通过大节点审核。
- Phase 04：Task 04-01 至 Task 04-02 已完成并通过审核。
- Phase 05：Task 05-01 至 Task 05-05 已完成并通过审核，大节点审核已通过。
- Phase 06：Task 06-01 至 Task 06-04 已完成并通过审核。
- 下一步：Phase 06 Task 06-05。

## 已完成阶段和任务

- Phase 01 项目初始化：已完成。
- Phase 02 Supabase 与数据库：新版 Task 02-00 至 Task 02-06 已完成。
- Phase 03 认证与路由保护：Task 03-01 至 Task 03-04 已完成并审核通过。
- Phase 04 应用主界面：Task 04-01 至 Task 04-02 已完成并审核通过。
- Phase 05 知识数据层：Task 05-01 至 Task 05-05 已完成并审核通过，大节点审核已通过。
- Phase 06 知识元数据与交互：Task 06-01 至 Task 06-04 已完成并审核通过。

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

- Phase 06 Task 06-05：实现归档页。

## 大节点审核记录

| 节点 | 状态 | 备注 |
|---|---|---|
| Phase 01 | 已审核通过 | 项目初始化完成。 |
| Phase 02 | 已审核通过 | 新版拆分至 Task 02-06 已完成。 |
| Phase 03 | 已审核通过 | Task 03-01 至 Task 03-04 已完成。 |
| Phase 04 Task 04-01 | 已审核通过 | AppShell 桌面布局完成，commit `fd7d469`；Spec / Quality review 均通过。 |
| Phase 04 Task 04-02 | 已审核通过 | App navigation 完成，commit `0ad5716`；Spec / Quality review 均通过。 |
| Phase 05 Task 05-01 | 已审核通过 | 知识数据访问层基础函数完成，commit `4faf71d`；外键修复 commit `45fc26d`；Spec 复审 `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`。 |
| Phase 05 Task 05-02 | 已审核通过 | 新建知识页基础版完成，commit `c954c6f`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题。 |
| Phase 05 Task 05-03 | 已审核通过 | 全部内容列表页基础版完成，commit `387b229`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题。 |
| Phase 05 Task 05-04 | 已审核通过 | 知识详情 / 编辑页基础版完成，commit `a132385`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题。 |
| Phase 05 Task 05-05 | 已审核通过 | 删除知识流程完成，commit `683d1d5`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题。 |
| Phase 05 | 已审核通过 | 大节点审核结论 `PHASE05_APPROVED`；允许进入 Phase 06 Task 06-01；验证通过 `npm.cmd run lint`、`npm.cmd run test:auth`、`npm.cmd run test:knowledge-items`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run test:knowledge-item-delete`、`npm.cmd run test:knowledge-list-item`、`npm.cmd run build`；必须修改：无。 |
| Phase 06 Task 06-01 | 已审核通过 | 知识元数据字段完成，implementation commit `a98df59`，fix commit `82a553c`；Spec 复审 `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题。 |
| Phase 06 Task 06-02 | 已审核通过 | 收藏功能完成，implementation commit `0cb4c06`，fix commit `bbfd5c6`；Spec review `SPEC_APPROVED`，Quality review 复审 `QUALITY_APPROVED`，无阻断问题。 |
| Phase 06 Task 06-03 | 已审核通过 | 收集箱页完成，implementation commit `f7ad3bf`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题。 |
| Phase 06 Task 06-04 | 已审核通过 | 收藏页完成，implementation commit `831a781`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题。 |

## 未决问题 / 风险

- 后续实现主布局和业务页面时，需要持续检查 Supabase SDK 是否扩散到页面或业务组件。
- Phase 06 后重点验证跨用户不可读、不可改、不可删。
- `src/components/layout/app-sidebar-nav.test.mjs` 暂未接入 `package.json` scripts，后续可补统一测试入口。
- `src/lib/knowledge/inbox-page.test.mjs` 暂未接入 `package.json` scripts，后续可补统一测试入口。
- `src/lib/knowledge/favorites-page.test.mjs` 暂未接入 `package.json` scripts，后续可补统一测试入口。
- Task 04-03 移动端导航为 P2，按 `development_plan` 推荐顺序排在后续。
- 后续实现 tags repository 前，应补齐 Drizzle schema 中 `tags` 和 `knowledge_item_tags`。
- 后续筛选复杂后可加强 query builder 测试。
- 当前没有独立 `typecheck` script，build 已覆盖 Next/TypeScript 集成检查。
- Drizzle schema 后续补齐 check constraints 和 `(id, user_id)` unique 元数据。
- 后续抽 UUID guard，避免非法 item id 触发 DB UUID 解析错误。
- 后续可将编辑表单的 FormData 字段读取限制为 string，避免 File 被 `String()` 转成 `[object File]`。
- 后续补统一 test 聚合脚本和真实 DB / 浏览器联调。
- 后续统一登录态失效处理策略。
- 新建页 validation test 后续可接入 `package.json` 测试脚本。
- 后续补面向用户的错误边界。
- 列表可访问性后续可改为 `ul` / `li`。
- 后续统一日期格式化和空间 / 类型 label 来源。
- 后续可抽 `MetadataSelect` 或 `KnowledgeMetadataFields`，减少新建 / 编辑重复。
- 后续可在 `src/constants/knowledge.ts` 导出 `DEFAULT_KNOWLEDGE_METADATA`。
- 后续可区分 create / update metadata 缺字段策略，避免编辑缺字段回落默认值。
- 后续可将 `toggleFavorite` 命名澄清为 set / update favorite。
- 后续统一收藏影响路径 revalidation。
