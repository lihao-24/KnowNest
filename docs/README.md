# 文档入口

这里记录当前仍有效的项目事实、产品范围和后续 agent 工作入口。文档保持轻量，避免把临时讨论沉淀成长期规范。

## 当前入口

- `../README.md`：项目目标、当前状态和计划能力
- `../AGENTS.md`：agent 工作规范、架构边界、验证和文档更新规则
- `../designs/mvp-ui.pen`：当前 MVP 登录页和三栏工作台 UI 基准
- `specs/initial-product-scope.md`：第一阶段产品范围
- `specs/mvp-product-design.md`：MVP 产品与交互设计
- `plans/2026-06-09-mvp-implementation-plan.md`：MVP 开发实施计划
- `reference/architecture.md`：双层 RAG、规则筛选和模块边界
- `reference/auth-and-storage.md`：统一 Supabase Auth 和独立业务库边界
- `reference/data-and-recommendation.md`：河南本科批/国家专项数据模型和推荐流程
- `reference/data-preparation-checklist.md`：河南数据准备清单和 CSV 字段建议
- `reference/data-trust-model.md`：数据可信度分级和使用原则
- `reference/upstream/xuefeng-agent/README.md`：上游 `xuefeng-agent` 参考资料索引和使用边界

## 当前开发状态

截至 2026-06-09，`plans/2026-06-09-mvp-implementation-plan.md` 已开始执行并完成第一条可运行 demo 竖切：

- 阶段 0 应用骨架：基本完成并通过验证。
- 阶段 1 登录：完成 demo auth 和 Supabase server helper，真实 Supabase 登录流程待接入验证。
- 阶段 2 数据库：schema、迁移脚本、会话 repository 初稿完成，真实 Postgres 端到端验证待做。
- 阶段 3 数据导入：`admission_records` CSV 校验和导入脚本初稿完成，样例 CSV 入库待做。
- 阶段 4 画像提取：硬字段规则提取初稿完成，手动修正画像待做。
- 阶段 5 推荐规则：内存数据规则筛选初稿完成，数据库驱动候选查询待做。
- 阶段 6 LLM 编排：demo provider 边界完成，真实 OpenAI-compatible Provider 待接入。
- 阶段 7 工作台 UI：桌面三栏 demo 初稿完成，真实数据驱动和窄屏抽屉交互待完善。
- 阶段 8 Docker：Dockerfile / Compose 初稿完成，`docker compose up -d --build` 待验证。

最近验证：`pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build`、`git diff --check` 均已通过。当前 `pnpm build` 使用 webpack 构建。

## 目录说明

```text
docs/
├── README.md
├── reference/   # 长期有效的系统事实、原则和上游参考资料
├── specs/       # 阶段性产品规格
└── plans/       # 阶段性实施计划，完成后作为历史记录保留
```

仓库根目录的 `designs/` 保存可直接指导实现的设计文件。当前只有 `designs/mvp-ui.pen`，后续 UI 改版时优先更新该文件或新增明确版本。

推荐未来按需增加：

- `docs/reference/external-services.md`：AI Provider、官方数据来源和域名暴露方式
- `docs/reference/verification.md`：测试、构建、数据校验和上线检查
- `docs/reports/`：调研、验证、上线或事故记录

不要创建空文档占位；只有当内容已经稳定、有复用价值时再新增。
