# 项目审查报告（2026-06-11）

## 审查目的

基于当前产品设计文档、实施计划与最新代码实现，再次核对项目距离 MVP 目标的实际进度，输出一份更新版审核报告，用于替代口头结论和补充上一版 2026-06-10 审查结论。

本报告重点回答五个问题：

- 当前哪些 MVP 能力已经真正落地。
- 哪些能力已经从“未完成”推进到“最小闭环已完成”。
- 哪些能力仍然只是样例链路或开发态能力。
- 设计文档、计划文档与实现之间还有哪些偏差。
- 下一轮开发最该优先补哪几块。

本次审查主要依据以下材料：

- `docs/specs/initial-product-scope.md`
- `docs/specs/mvp-product-design.md`
- `docs/plans/2026-06-09-mvp-implementation-plan.md`
- `designs/mvp-ui.pen`
- `src/`、`scripts/`、`package.json` 当前实现

说明：本次审查以代码核对和实现状态复盘为主。报告初稿基于仓库当前代码判断验证路径；提交前已补跑 `pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build`、`pnpm smoke:demo`、`pnpm smoke:supabase`、`pnpm smoke:provider` 和 `git diff --check`。真实 Supabase 与真实 Provider smoke 因环境变量缺失按设计跳过，未进行真实账号、真实 Provider 或真实 Postgres 浏览器端到端联调。

## 一、执行摘要

当前项目已经完成了一个可本地演示、可持续迭代的 MVP 主链路，完成度明显高于 2026-06-10 那一版报告所描述的状态。

目前已经具备：

- 真实 Supabase Auth 登录与受保护工作台。
- 三栏工作台主结构。
- 多会话新建、切换与历史恢复。
- 画像规则抽取与右侧最小手动修正闭环。
- 基于结构化数据的候选初筛。
- OpenAI-compatible Provider 服务端接入。
- 志愿篮保存/取消保存闭环。
- `score_segments` 与 `school_documents` 样例导入、检索和展示链路。
- Playwright browser smoke 脚本。

但从设计文档定义的“完整第一版”来看，仍有几个关键差距：

- 真实河南数据与真实环境验证还未完全收口。
- 推荐规则仍是粗粒度初筛，不是高可信推荐引擎。
- `school_documents` 目前只是关键词检索样例链路，不是完整 RAG。
- 工作台首屏恢复仍偏“恢复最近画像”，还不是完整恢复最近咨询状态。
- 志愿篮虽然能保存，但还没有独立管理视图、备注编辑和导出准备页。

综合判断：

> 当前项目已完成 MVP 主链路的大部分关键拼图，整体完成度约 75% ~ 85%。

它已经不再只是“技术骨架”，而是一个具备较完整交互闭环的开发态 MVP；当前主要剩余工作已经从“有没有”转向“是否足够可信、完整、可交付”。

## 二、审查范围与判定基准

### 2.1 产品目标基准

依据 `docs/specs/initial-product-scope.md` 与 `docs/specs/mvp-product-design.md`，MVP 的核心目标包括：

1. 面向河南省高考志愿辅助。
2. 通过对话采集和沉淀考生画像。
3. 在信息不完整时优先追问，不直接生成完整结论。
4. 基于结构化数据给出冲、稳、保候选。
5. 在右侧持续展示画像、来源、风险和待核验事项。
6. 支持候选保存到志愿篮。
7. 用克制直白的风格输出解释，但不编造事实。

### 2.2 实施阶段基准

依据 `docs/plans/2026-06-09-mvp-implementation-plan.md`，重点核对以下阶段：

- 阶段 1：统一登录
- 阶段 2：业务数据库与 schema
- 阶段 3：数据导入
- 阶段 4：画像提取与编辑
- 阶段 5：推荐规则服务
- 阶段 6：LLM 问答编排
- 阶段 7：工作台 UI
- 阶段 8：Docker / 本地验证路径

## 三、当前已完成能力

### 3.1 登录与受保护工作台

已实现真实 Supabase Auth 登录与受保护工作台：

- 登录页：`src/app/login/page.tsx`
- 登录页壳：`src/components/LoginPageShell.tsx`
- 服务端鉴权：`src/lib/auth/server.ts`
- 工作台页：`src/app/workspace/page.tsx`
- 登录路由：`src/app/auth/sign-in/route.ts`
- 退出路由：`src/app/auth/logout/route.ts`
- 当前用户接口：`src/app/api/auth/me/route.ts`

审查结论：

- 已满足阶段 1 的核心目标。
- 鉴权边界清晰，服务端拿 user，不依赖客户端传 `user_id`。
- 真实账号 smoke 脚本已存在，但是否已在真实环境完整跑通，仍取决于外部环境变量和测试账号准备情况。

### 3.2 三栏工作台主结构

当前前端已实现与设计文档一致的三栏工作台：

- 左侧会话列表
- 中间聊天问答区
- 右侧当前总结区

核心实现：

- `src/components/WorkspaceShell.tsx`
- `src/components/StatusPill.tsx`

右侧总结区已包含：

- 考生画像
- 缺失信息
- 候选清单
- 数据来源
- 待核验事项

审查结论：

- 信息架构已经与 `docs/specs/mvp-product-design.md` 对齐。
- 目前不能说视觉细节与 `.pen` 设计稿完全逐像素一致，但结构、信息密度方向和状态表达已经明显落地。

### 3.3 多会话能力基础闭环

当前系统已经具备真正的多会话基础闭环：

- 新建会话 API：`src/app/api/chat/sessions/route.ts`
- 加载会话 API：`src/app/api/chat/sessions/[sessionId]/route.ts`
- 工作台前端新建/切换逻辑：`src/components/WorkspaceShell.tsx`
- 聊天按当前会话续聊：`src/app/api/chat/route.ts`
- 服务端按当前会话恢复画像：`src/lib/chat/orchestrator.ts`
- Repository 按 `user_id + session_id` 做约束：`src/lib/db/chat-repository.ts`

已具备的实际能力：

- 新建会话。
- 左侧切换会话。
- 恢复当前会话消息历史。
- 恢复当前会话画像。
- 继续在当前选中会话下提问。

审查结论：

- 这部分已经从“未闭环”推进到“基础闭环已完成”。
- 当前剩余问题不在有没有多会话，而在首屏恢复是否足够完整，以及真实 Postgres 隔离是否已做更强的端到端证明。

### 3.4 画像抽取与缺失信息判断

当前已有规则化画像提取能力：

- 分数
- 位次
- 科类归一化（理科/文科 -> 物理类/历史类）
- 国家专项资格
- 地域偏好/排斥
- 专业兴趣/排斥
- 核心诉求
- 家庭资源
- 预算关注

核心实现：

- `src/lib/profile/extract.ts`
- `src/lib/profile/types.ts`

缺失字段判断已接入聊天编排：

- `src/lib/chat/orchestrator.ts`

审查结论：

- 已满足“资料不全先追问”的基础要求。
- 规则抽取对 MVP 第一阶段是合理实现路径。
- 抽取覆盖面已经比最初计划文字描述更完整。

### 3.5 画像手动修正最小闭环

右侧总结区已支持最小可用的画像手动修正：

- 编辑器：`src/components/WorkspaceShell.tsx`
- 保存接口：`src/app/api/chat/sessions/[sessionId]/profile/route.ts`

当前支持编辑字段：

- 分数
- 位次
- 科类
- 国家专项资格
- 核心诉求
- 地域偏好
- 专业兴趣

审查结论：

- 已不再是“只有提取，没有修正”。
- 画像手动修正最小闭环已经成立。
- 但更完整的画像确认流、软字段确认和更多字段编辑能力仍未补齐。

### 3.6 规则层推荐初筛

当前已有第一版推荐引擎：

- `src/lib/recommendation/engine.ts`

已实现：

- 河南省过滤
- 本科批过滤
- 科类过滤
- 国家专项资格过滤
- 位次比例粗分冲/稳/保
- 缺少当年招生计划风险提示
- 当年计划减少风险提示

审查结论：

- 推荐层已经形成可重复运行的规则初筛逻辑。
- 已达到“规则层先筛，解释层再说”的设计方向。
- 但当前仍是 MVP 粗颗粒推荐逻辑，适合初筛，不适合作为高可信最终判断。

### 3.7 LLM 问答编排与 Provider 服务端接入

当前真实 OpenAI-compatible Provider 接入已经存在：

- `src/lib/ai/provider.ts`

聊天编排主链路：

- 聊天 API：`src/app/api/chat/route.ts`
- 编排：`src/lib/chat/orchestrator.ts`

当前已实现：

- 服务端构建结构化 summary。
- 将候选、来源、核验项等上下文传给模型。
- 配置 OpenAI-compatible Chat Completions。
- 对模型输出做候选边界校验。
- 若回复不通过校验，则回退安全文本，不允许模型编学校。

审查结论：

- “真实 Provider 尚未接入”的说法已经不成立。
- 当前 AI 层已经从纯 demo 文本推进到可配置真实模型调用。
- 但输出质量、结构化校验、引用约束仍有提升空间。

### 3.8 志愿篮保存 / 取消保存

当前已经具备最小志愿篮闭环：

- 列表/保存 API：`src/app/api/saved-choices/route.ts`
- 删除 API：`src/app/api/saved-choices/[candidateId]/route.ts`
- Repository：`src/lib/db/saved-choice-repository.ts`
- 工作台保存按钮：`src/components/WorkspaceShell.tsx`

已保存字段包括：

- `candidateId`
- `schoolName`
- `majorName`
- `batch`
- `planType`
- `bucket`
- `rationale`
- `riskTags`
- `sources`
- `note`
- `sessionId`

审查结论：

- 志愿篮保存能力已经落地，至少在“保存 / 取消保存”这一层是成立的。
- 因此“志愿篮尚未实现”的说法已经过时。
- 但它目前仍属于工作台内嵌最小交互，而不是完整的志愿篮管理体验。

### 3.9 结构化数据导入基础

当前样例导入链路已经覆盖：

- `admission_records`
- `enrollment_plans`
- `score_segments`
- `school_documents`

相关脚本：

- `scripts/import-admissions.ts`
- `scripts/import-enrollment-plans.ts`
- `scripts/import-score-segments.ts`
- `scripts/import-school-documents.ts`

审查结论：

- 样例数据导入体系已基本完整。
- 当前主要问题不在脚本有没有，而在真实河南数据是否已整理并入库。

### 3.10 `score_segments` 样例链路

当前已实现：

- CSV 解析与导入
- repository 查询
- 在聊天 summary 中展示最近分段信息和来源

核心相关实现：

- `src/lib/admissions/score-segments.ts`
- `src/lib/admissions/score-segment-repository.ts`
- `scripts/import-score-segments.ts`

审查结论：

- `score_segments` 已经不是“完全未做”。
- 但当前主要用于来源说明和分数/位次核验提示，还没有深度参与推荐分层决策。

### 3.11 `school_documents` 关键词检索样例链路

当前已实现：

- `school_documents` CSV 导入
- 基于学校名匹配文档
- 提取文档片段
- 扫描体检、单科、外语、学费、校区等关键词
- 将片段和风险标签并入候选 evidence / sources / verification items

核心实现：

- `src/lib/rag/school-document-search.ts`
- `scripts/import-school-documents.ts`

审查结论：

- 资料检索样例链路已经存在。
- 但它目前是“关键词检索 + 风险提示”，还不是完整意义上的 RAG。

### 3.12 浏览器级 smoke 基础

当前仓库已存在 Playwright 依赖和 smoke 脚本：

- `playwright`：`package.json`
- demo smoke：`scripts/smoke-demo-workspace.ts`
- Supabase smoke：`scripts/smoke-supabase-login.ts`
- Provider smoke：`scripts/smoke-provider.ts`

`smoke-demo-workspace.ts` 已覆盖：

- 进入工作台
- 发起聊天
- 右栏画像联动
- 候选展示
- `score_segments` / `school_documents` 来源展示
- 保存 / 取消保存候选
- 新建会话
- 手动编辑画像
- 切换回原会话并恢复内容

审查结论：

- “浏览器级 smoke / e2e 未建立”的说法已经不准确。
- 目前更准确的表述应是：已有 smoke 脚本，但仍缺统一 `pnpm e2e` 入口和更强的真实环境验证。

## 四、部分完成能力

### 4.1 工作台首屏恢复

当前工作台首屏会恢复：

- 最近画像
- 会话列表
- 已保存候选

实现：`src/app/workspace/page.tsx`

但不会恢复最近一次完整候选与来源状态，而是基于最近画像生成一个“资料未全/待继续对话刷新”的初始化 summary。

审查结论：

- 数据持久化层是有的。
- 首屏体验还没有完全实现“继续上次咨询”的产品感。

### 4.2 画像管理完整度

虽然已支持手动编辑，但当前未实现：

- 家庭资源编辑
- 预算约束编辑
- 排斥项编辑
- 软字段 LLM 辅助结构化 + 用户确认流程

审查结论：

- 画像“提取 + 最小修正”已完成。
- 画像“完整确认流”仍未完成。

### 4.3 推荐规则可信度

当前推荐层虽可用，但仍存在以下不足：

- 冲稳保阈值较粗。
- 阈值硬编码，缺少配置化能力。
- 风险标签种类偏少。
- `score_segments` 尚未深度参与推荐判断。
- `school_documents` 尚未形成硬约束过滤。

审查结论：

- 当前推荐层适合样例验证和开发态 MVP。
- 尚不足以支撑高可信、低误导风险的正式推荐体验。

### 4.4 志愿篮体验完整度

当前已有保存/取消保存，但仍缺：

- 独立志愿篮列表页或面板
- 用户备注编辑交互
- 收藏后二次管理与对比
- 为导出准备的后续交互

审查结论：

- 数据层和最小 UI 已经完成。
- 产品体验层面仍属于“够用但不完整”。

### 4.5 Docker / 本地部署验证

目前仓库有：

- Dockerfile
- docker-compose 初稿
- 迁移脚本
- smoke 脚本

但本次审查没有证据证明以下事项已完全收口：

- 完整 `docker compose up -d --build` 实机通过
- 容器环境下 app 可访问
- 容器环境下真实 Supabase 鉴权完整通过
- 容器环境下真实 Provider 与数据库联调稳定

审查结论：

- 配置和路径都有了。
- 真实部署态收口验证仍待确认。

## 五、尚未完成的关键项

### 5.1 完整 RAG 尚未完成

当前 `school_documents` 仅实现了：

- 学校名匹配
- 文本关键词扫描
- 片段截取
- 粗粒度风险提示

但尚未实现：

- 文档 chunking
- embedding
- vector retrieval
- chunk 级证据引用
- 基于文档内容的更严格约束判断

审查结论：

- 当前应描述为“轻量资料检索链路”而不是“完整 RAG”。

### 5.2 真实河南数据闭环

虽然样例 CSV 和导入脚本都已具备，但真实河南数据仍待持续接入、清洗和验证：

- `admission_records`
- `enrollment_plans`
- `score_segments`
- `school_documents`

审查结论：

- 当前主链路可演示。
- 但要进入真实使用阶段，真实数据仍是核心门槛。

### 5.3 真实环境门控验证

当前 smoke 脚本已存在，但仍需做更强的门控验证：

- 真实 Supabase 账号
- 真实 Postgres
- 真实 Provider key
- 真实样例/半真实数据

审查结论：

- 当前验证体系已起步。
- 但“可交付前复审”还缺真实环境证据链。

### 5.4 窄屏抽屉式工作台

设计文档和计划文档均提到窄屏下应有降级体验，但当前代码未体现完整抽屉式右侧面板方案。

审查结论：

- 桌面端主工作台已成立。
- 窄屏工作台仍待补齐。

## 六、文档与实现不一致项

### 6.1 上一版审查报告已有部分判断过时

`docs/reports/2026-06-10-project-audit-report.md` 中以下结论已不再准确：

- “真实 LLM Provider 尚未接入”
- “志愿篮保存能力尚未实现”
- “多会话能力未完整闭环”
- “score_segments / school_documents / RAG 链路未完成”中的前两项表述过于笼统
- “浏览器级 smoke / e2e 验证未建立”

更准确的当前结论应是：

- 真实 Provider 已接入，但仍需真实环境验证与更强输出约束。
- 志愿篮最小闭环已实现，但管理体验未完整。
- 多会话基础闭环已实现，但首屏恢复仍不完整。
- `score_segments` 和 `school_documents` 样例链路已完成，完整 RAG 未完成。
- smoke 已建立，但真实环境验证仍待补齐。

### 6.2 实施计划文档局部描述滞后

`docs/plans/2026-06-09-mvp-implementation-plan.md` 顶部“当前状态”已相对新，但文档后部仍保留“当前尚未新增 `pnpm e2e` 或 browser smoke 脚本”的旧描述。

这与当前仓库已存在的：

- `smoke:demo`
- `smoke:supabase`
- `smoke:provider`
- Playwright 依赖

并不一致。

审查结论：

- 计划文档局部需要后续同步，否则容易造成对验证覆盖度的低估。

### 6.3 完整推荐触发条件与实现仍有偏差

设计文档将“是否考虑国家专项计划”列为完整推荐前的重要条件之一。

但当前缺失字段判断 `getMissingProfileFields()` 只要求：

- `score`
- `rank`
- `subjectType`
- `primaryGoal`

未把 `eligibleNationalSpecialPlan` 作为硬阻断条件。

审查结论：

- 这是当前仍然存在的真实产品边界偏差。
- 可能导致国家专项资格未明确时过早进入推荐阶段。

### 6.4 画像展示范围小于抽取范围

代码中已经可以抽取 `familyResources`、`budgetConstraints` 等信息，但右侧展示和编辑 UI 目前没有完整承接这些字段。

审查结论：

- 这不是实现错误，但说明“画像模型能力”已经走在“工作台呈现能力”前面。

## 七、代码质量与实现风险

### 7.1 代码结构优点

当前代码结构分层清晰：

- `auth`
- `db`
- `profile`
- `admissions`
- `recommendation`
- `rag`
- `chat`
- `ai`

主要优点：

- 模块职责比较清楚。
- 服务端边界较明确。
- 规则层与解释层分离方向正确。
- 有单测和 smoke 的基础，便于继续演进。

### 7.2 主要风险

#### 风险 1：数据库失败时 fallback 偏静默

部分 repository 层在数据库不可用或查询失败时，会回退到 fallback 数据或内存逻辑。

风险：

- 容易掩盖真实数据库故障。
- 用户和开发者可能误判当前是否为真实持久化状态。
- 环境问题在早期不容易暴露。

#### 风险 2：推荐结果可信度仍有限

当前推荐仍主要依赖：

- 历史招生记录
- 粗粒度位次比例
- 少量风险标签

风险：

- 容易让工作台观感先于真实能力成熟度。
- 若过早用于真实决策，可信度边界不够强。

#### 风险 3：资料检索能力仍偏轻

当前 `school_documents` 更接近“资料提示器”而不是严格的章程约束引擎。

风险：

- 容易把“能搜到片段”误判为“已经实现完整章程校验”。

#### 风险 4：首屏恢复不够产品化

虽然切会话能恢复，但工作台首屏仍偏“恢复最近画像”而非“恢复最近完整咨询上下文”。

风险：

- 会削弱长期连续使用时的产品感。
- 让会话工作台更像 demo，而不是稳定工作流工具。

## 八、建议优先级

### P0：下一轮必须优先推进

1. 做一轮真实环境门控验证
   - 真实 Supabase 账号
   - 真实 Postgres
   - 真实 Provider key
   - 真实或半真实河南样例数据

2. 统一完整推荐触发条件
   - 明确国家专项资格是否为阻断条件
   - 让实现与设计边界保持一致

3. 更新进度认知
   - 后续文档应明确：多会话、志愿篮最小闭环、Provider、smoke 都已经存在，避免继续按旧状态排期

### P1：尽快补齐产品完整度

4. 优化工作台首屏 hydrate
   - 恢复最近完整 session 状态
   - 恢复候选、来源和核验事项，而不只是画像

5. 扩展画像编辑与展示
   - 家庭资源
   - 预算约束
   - 排斥项
   - 软字段确认流程

6. 完善志愿篮体验
   - 志愿篮列表/面板
   - 备注编辑
   - 收藏后二次管理
   - 导出前准备

### P2：提升可信度和可交付性

7. 强化推荐规则
   - 更丰富风险标签
   - 阈值配置化
   - `score_segments` 更深接入

8. 强化资料检索链路
   - `school_documents` 从关键词提示升级为更可信的证据链

9. 补齐完整 RAG
   - chunking
   - embedding
   - retrieval
   - 引用约束

10. 补窄屏工作台体验
    - 抽屉式右侧面板
    - 小屏降级交互

## 九、阶段性结论

从“有没有可用主链路”来看，答案是明确肯定的。

从“是否已经达到设计文档意义上的完整一版可交付产品”来看，答案仍是否定的。

当前项目更准确的判断应是：

> 已完成一个质量较好的开发态 MVP，登录、会话、画像、推荐、解释、保存、来源展示和基础 smoke 已形成较完整闭环；接下来真正需要补的是可信度、真实数据、真实环境验证、首屏连续体验，以及从轻量资料检索升级到更完整证据链的那几块能力。

## 十、建议后续动作顺序

建议下一轮开发优先按以下顺序推进：

1. 真实环境门控验证
2. 统一完整推荐触发条件
3. 工作台首屏完整恢复
4. 志愿篮管理体验完善
5. 画像编辑与确认流扩展
6. 推荐规则强化
7. `school_documents` / RAG 能力升级

完成上述 1~4 项后，再做一轮以“真实账号 + 真实数据库 + 真实 Provider + 浏览器路径”为核心的阶段性复审，会更接近设计文档意义上的 MVP 收口标准。
