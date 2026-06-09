# 文档入口

这里记录当前仍有效的项目事实、产品范围和后续 agent 工作入口。文档保持轻量，避免把临时讨论沉淀成长期规范。

## 当前入口

- `../README.md`：项目目标、当前状态和计划能力
- `../AGENTS.md`：agent 工作规范、架构边界、验证和文档更新规则
- `specs/initial-product-scope.md`：第一阶段产品范围
- `specs/mvp-product-design.md`：MVP 产品与交互设计
- `plans/2026-06-09-mvp-implementation-plan.md`：MVP 开发实施计划
- `reference/architecture.md`：双层 RAG、规则筛选和模块边界
- `reference/auth-and-storage.md`：统一 Supabase Auth 和独立业务库边界
- `reference/data-and-recommendation.md`：河南本科批/国家专项数据模型和推荐流程
- `reference/data-preparation-checklist.md`：河南数据准备清单和 CSV 字段建议
- `reference/data-trust-model.md`：数据可信度分级和使用原则
- `reference/upstream/xuefeng-agent/README.md`：上游 `xuefeng-agent` 参考资料索引和使用边界

## 目录说明

```text
docs/
├── README.md
├── reference/   # 长期有效的系统事实、原则和上游参考资料
├── specs/       # 阶段性产品规格
└── plans/       # 阶段性实施计划，完成后作为历史记录保留
```

推荐未来按需增加：

- `docs/reference/external-services.md`：AI Provider、官方数据来源和域名暴露方式
- `docs/reference/verification.md`：测试、构建、数据校验和上线检查
- `docs/reports/`：调研、验证、上线或事故记录

不要创建空文档占位；只有当内容已经稳定、有复用价值时再新增。
