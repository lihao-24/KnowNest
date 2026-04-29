# KnowNest V0.1 功能自测记录

日期：2026-04-28，更新：2026-04-29

## 结论

状态：PASS（V0.1 功能自测完成）

本次自测完成了 package scripts、未接入 package scripts 的 model/helper tests、构建、lint、未登录浏览器路由保护、登录页桌面和 390x844 移动视口检查，以及用户隔离相关代码 / migration 边界检查。随后由用户在真实环境完成真实账号端到端手测，确认 V0.1 验收项通过。

说明：自动化与未登录浏览器验证由 Codex 执行；真实登录、已登录业务流程、多设备同步和 Supabase RLS 运行时隔离由用户在真实环境测试并确认通过。未在文档中记录真实账号、密码、数据库连接串或 Supabase secret。

## 真实账号端到端补测（Spec review 补做）

日期：2026-04-29

状态：PASS

本次补测按 Spec review 缺口完成真实环境验证：

- 真实账号登录成功。
- 退出登录通过。
- 已登录态新建、编辑、删除通过。
- 收藏 / 取消收藏通过。
- 归档 / 恢复归档通过。
- 收集箱流程通过。
- 标签添加、删除、筛选通过。
- 关键词、空间、状态、类型筛选通过。
- 移动端已登录布局可用。
- 多设备刷新同步正常。
- Supabase RLS 运行时用户隔离通过。
- 测试数据已按用户手测流程创建并清理。

补测结果：

| 项目 | 本次补测状态 | 证据 |
|---|---|---|
| 真实登录成功 | PASS | 用户真实环境手测确认通过。 |
| 退出登录 | PASS | 用户真实环境手测确认通过。 |
| 已登录态新建 / 编辑 / 删除 | PASS | 用户真实环境手测确认通过。 |
| 收藏 / 取消收藏 | PASS | 用户真实环境手测确认通过。 |
| 归档 / 恢复归档 | PASS | 用户真实环境手测确认通过。 |
| 收集箱 | PASS | 用户真实环境手测确认通过。 |
| 标签添加 / 删除 / 筛选 | PASS | 用户真实环境手测确认通过。 |
| 关键词 / 空间 / 状态 / 类型筛选 | PASS | 用户真实环境手测确认通过。 |
| 移动端已登录布局 | PASS | 用户真实环境手测确认通过。 |
| 多设备刷新同步 | PASS | 用户真实环境手测确认通过。 |
| Supabase RLS 运行时隔离 | PASS | 用户真实环境手测确认通过。 |

## 自动化验证

以下命令均退出码 0：

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test:auth`
- `npm.cmd run test:knowledge-items`
- `npm.cmd run test:knowledge-item-draft`
- `npm.cmd run test:knowledge-item-delete`
- `npm.cmd run test:knowledge-item-favorite`
- `npm.cmd run test:knowledge-list-item`
- `npm.cmd run test:tags`
- `npm.cmd run test:tag-input`
- `npm.cmd run test:markdown-preview`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/knowledge/knowledge-feedback-state.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/knowledge/inbox-page.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/knowledge/favorites-page.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/knowledge/archive-page.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/tags/tag-filter-model.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/layout/mobile-nav-model.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/layout/app-sidebar-nav.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/markdown/markdown-editor-model.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/markdown/markdown-edit-preview-model.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-filters-model.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-metadata-filter-model.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/knowledge/knowledge-search-model.test.mjs`
- `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/app/app/settings/settings-model.test.mjs`

浏览器级验证：

- `http://127.0.0.1:3000/login` 返回 HTTP 200。
- headless Chrome CDP 桌面视口 1365x900：`/login` 渲染 KnowNest、邮箱输入、密码输入、登录按钮；`/app` 未登录跳转 `/login`。
- headless Chrome CDP iPhone 390x844：`/login` 无横向溢出，邮箱 / 密码输入和登录按钮高度均为 44px；未登录访问 `/app` 后停留 `/login` 且无横向溢出。

## 清单状态

| 项目 | 状态 | 证据 / 限制 |
|---|---|---|
| 登录 | 通过 | `test:auth` 通过；CDP 验证登录页表单可见；用户真实环境手测确认真实登录成功。 |
| 退出登录 | 通过 | `test:auth`、`settings-model.test.mjs` 通过；用户真实环境手测确认退出登录通过。 |
| 未登录路由保护 | 通过 | `test:auth` 通过；CDP 验证 `/app` 未登录跳转 `/login`。 |
| 新建知识 | 通过 | `test:knowledge-items`、`test:knowledge-item-draft`、build 通过；用户真实环境手测确认通过。 |
| 编辑知识 | 通过 | `test:knowledge-items`、`test:knowledge-item-draft`、build 通过；用户真实环境手测确认通过。 |
| 删除知识 | 通过 | `test:knowledge-item-delete`、`test:knowledge-items` 通过；用户真实环境手测确认通过。 |
| 收藏 | 通过 | `test:knowledge-item-favorite`、`test:knowledge-list-item` 通过；用户真实环境手测确认通过。 |
| 取消收藏 | 通过 | `test:knowledge-item-favorite` 通过；用户真实环境手测确认通过。 |
| 归档 | 通过 | `archive-page.test.mjs`、`knowledge-metadata-filter-model.test.mjs` 通过；用户真实环境手测确认通过。 |
| 恢复归档 | 通过 | `test:knowledge-item-draft`、`archive-page.test.mjs` 通过；用户真实环境手测确认通过。 |
| 收集箱 | 通过 | `inbox-page.test.mjs` 通过；用户真实环境手测确认通过。 |
| 标签添加 | 通过 | `test:tags`、`test:tag-input` 通过；用户真实环境手测确认通过。 |
| 标签删除 | 通过 | `test:tags`、`test:tag-input` 通过；用户真实环境手测确认通过。 |
| 标签筛选 | 通过 | `tag-filter-model.test.mjs`、`test:knowledge-items` 通过；用户真实环境手测确认通过。 |
| 关键词搜索 | 通过 | `knowledge-search-model.test.mjs`、`test:knowledge-items` 通过；用户真实环境手测确认通过。 |
| 空间筛选 | 通过 | `knowledge-metadata-filter-model.test.mjs`、`test:knowledge-items` 通过；用户真实环境手测确认通过。 |
| 状态筛选 | 通过 | `knowledge-metadata-filter-model.test.mjs`、`inbox-page.test.mjs`、`archive-page.test.mjs` 通过；用户真实环境手测确认通过。 |
| 类型筛选 | 通过 | `knowledge-metadata-filter-model.test.mjs`、`test:knowledge-items` 通过；用户真实环境手测确认通过。 |
| 移动端布局 | 通过 | `mobile-nav-model.test.mjs` 通过；CDP 390x844 验证 `/login` 和未登录 `/app` 重定向无横向溢出；用户真实环境手测确认已登录 app 页面可用。 |
| 多设备刷新同步 | 通过 | `test:knowledge-items` 验证数据层持久化查询模型；用户真实环境手测确认多设备刷新同步正常。 |
| 开发期 RLS 数据隔离 / 生产期服务端用户隔离策略 | 通过 | `db/migrations/0001_initial_schema.sql` 含 RLS enable 和 `auth.uid() = user_id` policies；`src/lib/db/knowledge-items.ts`、`src/lib/db/tags.ts` 查询 / 写入带 `userId` / `user_id` 过滤或写入；用户真实环境手测确认 RLS 运行时用户隔离通过。 |

## 代码边界检查

- `src/lib/db/knowledge-items.ts`：列表、详情、更新、删除、收藏查询均限定 `user_id = userId`；标签筛选子查询也限定 `knowledge_item_tags.user_id = userId`。
- `src/lib/db/tags.ts`：标签列表、创建、查询、绑定更新均使用 `userId`；关系表写入使用同一 `user_id`。
- `db/migrations/0001_initial_schema.sql`：保留 Supabase-only RLS 段，业务表启用 RLS，并为 profiles、knowledge_items、tags、knowledge_item_tags 设置 own-data policies。

## 剩余风险

- V0.1 验收项无阻断风险。
- 真实账号端到端流程、多设备刷新同步和 RLS 运行时隔离结果来自用户在真实环境中的手测确认。
