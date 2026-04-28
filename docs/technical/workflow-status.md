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
- Phase 06：Task 06-01 至 Task 06-05 已完成并通过审核，大节点审核已通过。
- Phase 07：Task 07-01 至 Task 07-04 已完成并通过审核，大节点审核已通过。
- Phase 08：Task 08-01 至 Task 08-03 已完成并通过审核，大节点审核已通过。
- Phase 09：Task 09-01 至 Task 09-03 已完成并通过审核，大节点审核已通过。
- Phase 10：Task 10-01 至 Task 10-02 已完成并通过审核。
- 下一步：Phase 10 Task 10-03 完善保存与删除反馈。

## 已完成阶段和任务

- Phase 01 项目初始化：已完成。
- Phase 02 Supabase 与数据库：新版 Task 02-00 至 Task 02-06 已完成。
- Phase 03 认证与路由保护：Task 03-01 至 Task 03-04 已完成并审核通过。
- Phase 04 应用主界面：Task 04-01 至 Task 04-02 已完成并审核通过。
- Phase 05 知识数据层：Task 05-01 至 Task 05-05 已完成并审核通过，大节点审核已通过。
- Phase 06 知识元数据与交互：Task 06-01 至 Task 06-05 已完成并审核通过，大节点审核已通过。
- Phase 07 标签系统：Task 07-01 至 Task 07-04 已完成并审核通过，大节点审核已通过。
- Phase 08 搜索与筛选：Task 08-01 至 Task 08-03 已完成并审核通过，大节点审核已通过。
- Phase 09 Markdown 编辑体验：Task 09-01 至 Task 09-03 已完成并审核通过，大节点审核已通过。
- Phase 10 移动端与体验完善：Task 10-01 状态反馈 / 补齐空状态、加载状态、错误状态已完成并审核通过；Task 10-02 优化移动端布局已完成并审核通过；Phase 10 大节点未完成。

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

- Phase 10 Task 10-03：完善保存与删除反馈。

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
| Phase 06 Task 06-05 | 已审核通过 | 归档页完成，implementation commit `e266e5c`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题。 |
| Phase 06 | 已审核通过 | 大节点审核结论 `PHASE06_APPROVED`；Task 06-01 至 Task 06-05 已完成；验证通过 `npm.cmd run lint`、`npm.cmd run test:auth`、`npm.cmd run test:knowledge-items`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run test:knowledge-item-delete`、`npm.cmd run test:knowledge-item-favorite`、`npm.cmd run test:knowledge-list-item`、inbox/favorites/archive page helper tests、`src/components/layout/app-sidebar-nav.test.mjs`、`npm.cmd run build`；必须修改：无；允许进入 Phase 07 Task 07-01。 |
| Phase 07 Task 07-01 | 已审核通过 | 标签数据访问层完成，implementation commit `2049694`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `npm.cmd run test:tags`、`npm.cmd run test:knowledge-items`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run test:knowledge-item-favorite`、`npm.cmd run test:knowledge-item-delete`、`npm.cmd run lint`、`npm.cmd run build`。 |
| Phase 07 Task 07-02 | 已审核通过 | TagInput 组件完成，implementation commit `7baab633`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `npm.cmd run test:tag-input`、`npm.cmd run lint`、`npm.cmd run build`。 |
| Phase 07 Task 07-03 | 已审核通过 | 标签接入新建和编辑流程完成，implementation commit `679af9d`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `npm.cmd run test:tags`、`npm.cmd run test:tag-input`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run test:knowledge-list-item`、`npm.cmd run test:knowledge-items`、`npm.cmd run lint`、`npm.cmd run build`。 |
| Phase 07 Task 07-04 | 已审核通过 | 标签筛选基础能力完成，implementation commit `3bb8f2e`，spec fix commit `43ca34f`；Spec 复审 `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `npm.cmd run test:knowledge-items`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/tags/tag-filter-model.test.mjs`、`npm.cmd run test:tags`、`npm.cmd run test:knowledge-list-item`、inbox/favorites/archive page helper tests、`npm.cmd run lint`、`npm.cmd run build`。 |
| Phase 07 | 已审核通过 | 大节点审核结论 `PHASE07_APPROVED`；Task 07-01 至 Task 07-04 已完成；验证通过 `npm.cmd run lint`、`npm.cmd run test:tags`、`npm.cmd run test:tag-input`、`npm.cmd run test:knowledge-items`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run test:knowledge-list-item`、`npm.cmd run test:knowledge-item-favorite`、`npm.cmd run test:knowledge-item-delete`、`src/components/tags/tag-filter-model.test.mjs`、inbox/favorites/archive page helper tests、`npm.cmd run build`；必须修改：无；允许进入 Phase 08 Task 08-01。 |
| Phase 08 Task 08-01 | 已审核通过 | 关键词搜索完成，implementation commit `3fe3c2c`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-search-model.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/tags/tag-filter-model.test.mjs`、`npm.cmd run test:knowledge-items`、`npm.cmd run test:tags`、`npm.cmd run test:knowledge-list-item`、`npm.cmd run lint`、`npm.cmd run build`。 |
| Phase 08 Task 08-02 | 已审核通过 | 空间、状态、类型筛选完成，implementation commit `f739d90`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-metadata-filter-model.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-search-model.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/tags/tag-filter-model.test.mjs`、`npm.cmd run test:knowledge-items`、`npm.cmd run test:tags`、`npm.cmd run test:knowledge-list-item`、inbox/favorites/archive page helper tests、`npm.cmd run lint`、`npm.cmd run build`。 |
| Phase 08 Task 08-03 | 已审核通过 | 收藏筛选和清除筛选完成，implementation commit `abf28dd`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-filters-model.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-metadata-filter-model.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-search-model.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/tags/tag-filter-model.test.mjs`、`npm.cmd run test:knowledge-items`、`npm.cmd run test:tags`、`npm.cmd run test:knowledge-list-item`、`npm.cmd run test:knowledge-item-favorite`、`npm.cmd run lint`、`npm.cmd run build`。 |
| Phase 08 | 已审核通过 | 大节点审核结论 `PHASE08_APPROVED`；Task 08-01 至 Task 08-03 已完成；验证通过 `npm.cmd run lint`、`npm.cmd run test:knowledge-items`、`npm.cmd run test:knowledge-list-item`、`npm.cmd run test:knowledge-item-favorite`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run test:knowledge-item-delete`、`npm.cmd run test:tags`、`src/components/knowledge/knowledge-search-model.test.mjs`、`src/components/knowledge/knowledge-metadata-filter-model.test.mjs`、`src/components/knowledge/knowledge-filters-model.test.mjs`、`src/components/tags/tag-filter-model.test.mjs`、inbox/favorites/archive page helper tests、`npm.cmd run build`；必须修改：无；允许进入 Phase 09 Task 09-01。 |
| Phase 09 Task 09-01 | 已审核通过 | MarkdownEditor 组件完成，implementation commit `ba84729`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/markdown/markdown-editor-model.test.mjs`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run lint`、`npm.cmd run build`。 |
| Phase 09 Task 09-02 | 已审核通过 | MarkdownPreview 组件完成，implementation commit `bcefdb7`；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `npm.cmd run test:markdown-preview`、`npm.cmd run lint`、`npm.cmd run build`、`npm.cmd exec tsc -- --noEmit --incremental false`；依赖新增 `react-markdown@^10.1.0`，`package-lock.json` 已更新。 |
| Phase 09 Task 09-03 | 已审核通过 | 编辑 / 预览切换完成，implementation commit `e8fddc5`；新增共用 `MarkdownEditPreview` 组件，新建页和编辑页共用；编辑模式渲染 `MarkdownEditor`，预览模式渲染 `MarkdownPreview`，并用同名 hidden input 保留 `content` 提交值；未修改 DB / server action，未实现工具栏、上传、AI 等超范围功能；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/markdown/markdown-edit-preview-model.test.mjs`、`npm.cmd run test:markdown-preview`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/markdown/markdown-editor-model.test.mjs`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run lint`、`npm.cmd run build`。 |
| Phase 09 | 已审核通过 | 大节点审核结论 `PHASE09_APPROVED`；Task 09-01 至 Task 09-03 已完成；验证通过 `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/markdown/markdown-editor-model.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/markdown/markdown-edit-preview-model.test.mjs`、`npm.cmd run test:markdown-preview`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run lint`，此前任务级验证包含 `npm.cmd run build`；必须修改：无；允许进入 Phase 10 Task 10-01。 |
| Phase 10 Task 10-01 | 已审核通过 | 状态反馈 / 补齐空状态、加载状态、错误状态完成，implementation commit `007a635`；新增 `knowledge-feedback-state` 状态反馈模型和测试；新增 `/app` 与 `/app/items/[id]` 的 App Router `loading.tsx` / `error.tsx`；`/app` 搜索 / 筛选无结果文案走模型；`KnowledgeList` 默认空态复用模型；保存失败、删除失败沿用已有 UI 错误展示链路；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/knowledge/knowledge-feedback-state.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/knowledge/inbox-page.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/knowledge/favorites-page.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/knowledge/archive-page.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-filters-model.test.mjs`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run test:knowledge-item-delete`、`npm.cmd run test:knowledge-list-item`、`npm.cmd run lint`、`npm.cmd run build`。 |
| Phase 10 Task 10-02 | 已审核通过 | 优化移动端布局完成，implementation commit `f0de390`；新增最小移动端导航抽屉，复用现有导航项和 active 判断逻辑；AppShell / 全局样式增加 `overflow-x-hidden`、`min-w-0`；登录页、列表页、新建页、编辑页、设置页补齐移动端宽度约束和触控尺寸；列表项、筛选器、标签、Markdown 编辑 / 预览补强长内容处理；Spec review `SPEC_APPROVED`，Quality review `QUALITY_APPROVED`，无阻断问题；验证通过 `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/layout/mobile-nav-model.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/layout/app-sidebar-nav.test.mjs`、`npm.cmd run test:markdown-preview`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run test:knowledge-item-delete`、`npm.cmd run test:knowledge-item-favorite`、`npm.cmd run test:tag-input`、`npm.cmd run test:knowledge-list-item`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-filters-model.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-metadata-filter-model.test.mjs`、`node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/tags/tag-filter-model.test.mjs`、`npm.cmd run test:auth`、`npm.cmd run test:knowledge-items`、`npm.cmd run test:tags`、`npm.cmd run lint`、`npm.cmd run build`、Chrome CDP 390x844 验证 `/login` 无横向溢出且输入和登录按钮高度 44px、未登录 `/app` 重定向后无横向溢出；非阻断风险：无可用登录会话 / 测试账号，已登录页面和真实移动端抽屉交互待后续真实设备 / 登录态手测。 |

## 未决问题 / 风险

- 后续实现主布局和业务页面时，需要持续检查 Supabase SDK 是否扩散到页面或业务组件。
- Phase 06 后重点验证跨用户不可读、不可改、不可删。
- `src/components/layout/app-sidebar-nav.test.mjs` 和 `src/components/layout/mobile-nav-model.test.mjs` 暂未接入 `package.json` scripts，后续可补统一测试入口。
- `src/lib/knowledge/inbox-page.test.mjs` 暂未接入 `package.json` scripts，后续可补统一测试入口。
- `src/lib/knowledge/favorites-page.test.mjs` 暂未接入 `package.json` scripts，后续可补统一测试入口。
- `src/lib/knowledge/archive-page.test.mjs` 暂未接入 `package.json` scripts，后续可补统一测试入口。
- 移动端已登录页面和真实 iPhone 视口手测待后续有测试账号 / 登录会话时补齐；当前浏览器级验证仅覆盖 `/login` 和未登录 `/app` 重定向后的移动端横向溢出检查。
- MobileNav 后续可补 `aria-controls`、Esc 关闭和 focus trap，进一步完善抽屉可访问性。
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
- 后续删除流程可加强列表页 revalidate 覆盖面。
- 后续可补真实 PostgreSQL 集成测试。
- 若引入 drizzle-kit schema diff，再统一约束命名以减少 schema drift 噪音。
- 后续接入表单时可补 TagInput 组件交互层测试。
- TagInput 空白 Enter 保留草稿可后续统一 UX 决策。
- 后续可优化 `attachTagsToKnowledgeItems` 为批量查询以减少 N+1。
- 后续可考虑新建 item + 保存标签合并事务。
- TagInput 未提交草稿随保存自动提交可后续 UX 决策。
- `src/components/tags/tag-filter-model.test.mjs` 暂未接入 `package.json` scripts，后续可补统一测试入口。
- `src/components/knowledge/knowledge-search-model.test.mjs` 暂未接入 `package.json` scripts，后续可补统一测试入口。
- `currentTagId` 当前未使用，后续可在交互需要时接入或清理。
- 无效 tag 参数当前会展示默认列表但不清理 URL，后续可统一 URL 参数清理策略。
- URL 中 `q` 不强制 canonical trim，后续可统一 URL 参数规范化策略。
- `VALID_SPACES` / `VALID_STATUSES` / `VALID_TYPES` 在多个 model 中重复，后续可抽共享 URL 参数工具。
- `src/components/knowledge/knowledge-metadata-filter-model.test.mjs` 暂未接入 `package.json` scripts，后续可补统一测试入口。
- 后续可补齐 `MetadataFilterGroupProps.currentSearchParams` 的 favorite 类型。
- helper tests 后续可接入聚合脚本。
- 移动端筛选器折叠可后续作为 UX 小任务收敛。
- `src/components/markdown/markdown-editor-model.test.mjs` 后续可接入 `package.json` scripts。
- MarkdownEditor props 后续如增多可考虑继承 textarea 原生属性。
- MarkdownPreview 后续可补 `mailto:` 更严格校验。
- `src/components/markdown/markdown-preview-model.test.mjs` 后续可接入 `package.json` scripts。
- `src/components/markdown/markdown-edit-preview-model.test.mjs` 后续可接入 `package.json` scripts。
- MarkdownEditPreview 后续可补 DOM / 组件级交互测试或 Tab aria 关联优化。
- `src/lib/knowledge/knowledge-feedback-state.test.mjs` 后续可接入 `package.json` scripts。
- 无效 tag 参数仍按既有策略忽略，后续可结合 URL 参数清理策略统一处理。
