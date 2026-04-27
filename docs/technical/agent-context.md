# KnowNest AI 工作上下文摘要

## 1. 项目定位

- 产品名：KnowNest，中文名：知巢。
- 定位：面向个人长期使用的、多端同步的、AI 增强型个人知识库 App。
- 当前用户：项目开发者本人，前端开发者，主要在 Mac、iPhone 和浏览器设备上使用。
- 第一阶段目标：先建立稳定、可同步、可长期演进的个人知识记录系统。
- 产品形态：V0.1 先做 Web App，后续再考虑 PWA、iOS App 和 AI 能力。
- 核心价值：快速记录、云端同步、生活 / 工作粗粒度区分、标签整理、基础搜索。

## 2. V0.1 范围

- V0.1 目标：可真实使用的云端同步个人知识库基础版。
- 必须包含：
  - 用户登录、退出登录、会话保持、路由保护。
  - 云端数据同步，多设备刷新后数据一致。
  - 知识条目列表、详情、新建、编辑、删除。
  - 收集箱、生活 / 工作空间、内容类型、状态、标签、收藏、归档。
  - 基础搜索：标题和正文。
  - 基础筛选：空间、状态、类型、标签、收藏。
  - Markdown 输入与基础查看，V0.1 可用 textarea + 预览。
  - 桌面端和 iPhone 浏览器基础响应式可用。
- V0.1 默认新建规则：
  - `space = work`
  - `type = note`
  - `status = inbox`
  - `is_favorite = false`
  - 标题和正文不能同时为空。
- V0.1 删除策略：真实删除，不做软删除或回收站。

## 3. 明确不做事项

- 不做 AI 总结、AI 生成标题、AI 标签建议、AI 问答、RAG、Embedding、向量检索。
- 不做 PWA、Capacitor、iOS App、原生 macOS App、推送、系统分享入口。
- 不做文件上传、图片上传、PDF 解析、网页全文抓取、浏览器插件、剪藏工具；V0.1 不接 Supabase Storage 或腾讯云 COS。
- 不做多人协作、团队空间、公开分享、评论、复杂权限体系。
- 不做知识图谱、双链、反向链接、块编辑器、版本历史、回收站。
- 不做任务管理、日历、提醒、习惯打卡、健康数据接入。
- 不做复杂全局状态管理、复杂缓存层、离线数据库。
- 不要一次性实现整个 V0.1；每次只处理一个明确小任务。

## 4. 技术栈

- 框架：Next.js，使用 App Router。
- 语言：TypeScript。
- 样式：Tailwind CSS。
- UI 组件：shadcn/ui 可选，不强制。
- 图标：lucide-react 可选。
- 数据库：开发期可用 Supabase PostgreSQL；生产期优先腾讯云轻量应用服务器 + 自建 PostgreSQL。
- 认证：开发期可用 Supabase Auth，V0.1 优先邮箱 + 密码登录；认证调用必须经过 `src/lib/auth`。
- 部署：开发 / 预览期可用 Vercel；生产期优先腾讯云轻量应用服务器，HTTPS 后续使用 Caddy / Let's Encrypt。
- 开发工具：开发期可以使用 Supabase Dashboard 查看表结构、RLS 和认证状态。
- Markdown：textarea + react-markdown 或同类库。
- 表单校验：Zod 可选；简单场景可先不用。
- 状态管理：优先 React 局部状态、URL Search Params、服务端数据加载；暂不引入 Redux / MobX / Zustand / XState。

## 5. 路由

- `/login`：登录页，不要求登录。
- `/app`：全部内容 / 首页，需要登录，默认展示非归档内容。
- `/app/inbox`：收集箱，需要登录，展示 `status = inbox`。
- `/app/favorites`：收藏，需要登录，展示 `is_favorite = true` 且非归档内容。
- `/app/archive`：归档，需要登录，展示 `status = archived`。
- `/app/items/new`：新建知识，需要登录。
- `/app/items/[id]`：知识详情 / 编辑，需要登录。
- `/app/settings`：设置，需要登录，展示当前邮箱、版本号和退出登录。
- 路由保护：`/app/**` 未登录跳转 `/login`；已登录访问 `/login` 跳转 `/app`。
- 导航项：新建知识、全部内容、收集箱、收藏、归档、生活、工作、设置。
- 生活 / 工作导航建议使用 `/app?space=life`、`/app?space=work`。

## 6. 数据库核心结构

- V0.1 使用 4 张业务表：
  - `profiles`
  - `knowledge_items`
  - `tags`
  - `knowledge_item_tags`
- 开发期使用 Supabase 时，所有业务表必须启用 Supabase RLS。
- 用户数据隔离不能只依赖前端路由保护；开发期由 Supabase RLS 兜底，生产期自建部署应由服务端认证 + repository / ORM 查询条件 + 数据库约束或 PostgreSQL RLS 保证。
- `profiles`：
  - `id uuid`，开发期对应 Supabase `auth.users.id`；业务代码不要直接依赖 `auth.users`。
  - `email text`。
  - `display_name text`，数据库文档中存在，V0.1 可不用。
  - `created_at`、`updated_at`。
- `knowledge_items`：
  - `id uuid`
  - `user_id uuid`
  - `title text`
  - `content text`
  - `space text`：`life | work`
  - `type text`：`note | link | prompt | project | log | excerpt | plan | snippet`
  - `status text`：`inbox | organized | archived`
  - `source_url text | null`
  - `is_favorite boolean`
  - `created_at`、`updated_at`
- `tags`：
  - `id uuid`
  - `user_id uuid`
  - `name text`
  - `created_at`、`updated_at`
  - 同一用户下 `name` 唯一，标签名 trim 后不能为空。
- `knowledge_item_tags`：
  - `user_id uuid`
  - `item_id uuid`
  - `tag_id uuid`
  - `created_at`
  - 主键：`(item_id, tag_id)`。
  - 保留 `user_id` 以简化开发期 RLS 和生产期服务端用户隔离，并防止跨用户绑定。
- 标签不要直接作为字符串数组落库；V0.1 推荐关系表设计。
- 搜索 V0.1 可先使用 `ilike` 搜索 `title` 和 `content`。

## 7. 目录约定

- 推荐目录以 `src/` 为主：
  - `src/app`：Next.js 页面、路由和 layout。
  - `src/components/layout`：`AppShell`、`AppSidebar`、`AppHeader`、`MobileNav`。
  - `src/components/knowledge`：知识列表、列表项、表单、筛选、收藏按钮、删除确认、空状态。
  - `src/components/tags`：标签输入、展示、筛选。
  - `src/components/markdown`：Markdown 编辑和预览。
  - `src/components/ui`：基础 UI 组件。
  - `src/lib/supabase`：开发期 Supabase client、server、middleware 工具，只作为基础设施 adapter 边界。
  - `src/lib/auth`：`getCurrentUser`、`requireUser`、登录、退出等认证辅助函数，是页面和组件唯一允许调用的认证入口。
  - `src/lib/db`：数据库访问层，集中封装数据库查询；开发期可在内部调用 Supabase SDK，后续可替换为 repository / ORM。
  - `src/lib/utils`：日期、字符串、URL 等工具。
  - `src/constants`：空间、状态、类型、路由和导航常量。
  - `src/types`：数据库类型、知识条目类型、标签类型。
- 命名规范：
  - 文件名使用 kebab-case。
  - 组件名使用 PascalCase。
  - 函数名使用 camelCase。
- 页面和业务组件不得直接调用 Supabase SDK、SQL client 或 ORM；数据库访问必须经过 `src/lib/db` 或后续 repository / ORM 层。
- 认证调用必须经过 `src/lib/auth`；页面和业务组件不得直接调用 `supabase.auth.*`。
- Supabase 专属能力只能封装在 adapter、服务层或迁移脚本内部，包括 Supabase Auth、RLS policies、`auth.users`、`auth.uid()` 和 Dashboard 操作。

## 8. UI 风格与交互

- 视觉方向：简洁、干净、安静、轻量、工具型、适合长期阅读和编辑。
- 桌面端：左侧导航 + 右侧内容区。
- 移动端：顶部栏 + 抽屉菜单；V0.1 不必做复杂底部导航。
- 新建入口必须明显；记录优先，整理延后。
- 列表是核心浏览方式，列表项建议展示标题、摘要、标签、空间、类型、更新时间、收藏状态。
- 编辑页使用标题输入、Markdown textarea、元信息面板。
- Markdown 预览可使用编辑 / 预览 Tab，不要直接执行用户输入中的原始 HTML。
- 每个核心页面要考虑加载中、空状态、错误状态。
- 保存、删除、登录等关键操作要有 loading 和失败提示。
- 删除必须二次确认，文案参考：`确定要删除这条知识吗？此操作无法撤销。`
- 移动端必须避免横向滚动，按钮可点击，输入框可输入，列表可滚动。

## 9. 开发原则

- 严格控制 V0.1 范围，不临时加入后续版本能力。
- 小步提交，每次任务只解决一个明确目标。
- 先跑通主链路：登录 -> 进入应用 -> 新建 -> 列表 -> 编辑 -> 删除。
- 数据安全不能后置：认证、开发期 RLS 或生产期服务端用户隔离必须尽早完成。
- 保持实现简单，不为小需求引入复杂抽象、复杂状态层或新依赖。
- 遵循现有文档和代码风格，优先修改现有文件。
- 业务类型、常量和数据库 check constraint 必须保持一致。
- 数据访问层集中封装，页面负责组织，组件负责展示和局部交互；页面和组件不得绕过 `src/lib/db` / repository / ORM 边界访问数据库。
- 错误不能静默吞掉；页面应展示可理解的错误提示。
- 中文文件按 UTF-8 读取和写入，发现乱码先停止判断原因。
- 尊重工作区现有改动，不覆盖、不回滚无关内容。

## 10. 每次任务交付要求

- 任务开始前先阅读本文件和与任务直接相关的源文档。
- 只执行用户指定的当前任务，不扩大范围。
- 修改前检查 `git status`，识别已有改动。
- 能做局部验证时，优先运行最相关的验证。
- 若是代码任务，至少检查：
  - 项目能启动或相关构建 / 类型检查通过。
  - 相关页面不崩溃。
  - 核心流程可手动验证。
  - 没有引入 V0.1 明确不做事项。
- 若无法验证，最终说明原因和剩余风险。
- 交付说明必须包含：
  - 改动文件。
  - 实现内容。
  - 验证方式和结果。
  - 是否发现文档、代码或需求冲突。
- 按任务粒度提交 Git，提交信息要清晰，避免 `update`、`fix`、`wip` 等模糊信息。

## 11. 已知文档差异

- `docs/technical/development_plan.md` 文件名使用下划线，但文档内部建议路径写作 `docs/technical/development-plan.md`。
- 产品总纲早期 `KnowledgeItem` 示例把 `tags` 写成 `string[]`，但 V0.1 需求和数据库文档明确推荐 `tags` + `knowledge_item_tags` 关系表设计；实现时以后者为准。
- 需求文档的 `profiles` 字段表未列出 `display_name`，数据库文档包含 `display_name` 且标注 V0.1 可不用；实现时可保留字段但不必在界面暴露。
