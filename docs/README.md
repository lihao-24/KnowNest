# 文档入口

这里记录当前仍有效的项目事实、产品范围和后续 agent 工作入口。文档保持轻量，避免把临时讨论沉淀成长期规范。

## 当前入口

- `../README.md`：项目目标、当前状态和计划能力
- `../AGENTS.md`：agent 工作规范、架构边界、验证和文档更新规则
- `specs/initial-product-scope.md`：第一阶段产品范围
- `reference/data-trust-model.md`：数据可信度分级和使用原则
- `reference/upstream/xuefeng-agent/README.md`：上游 `xuefeng-agent` 参考资料索引和使用边界

## 目录说明

```text
docs/
├── README.md
├── reference/   # 长期有效的系统事实、原则和上游参考资料
└── specs/       # 阶段性产品规格
```

推荐未来按需增加：

- `docs/reference/architecture.md`：技术栈确定后的模块职责和数据流
- `docs/reference/data-and-storage.md`：数据表、导入流程、隐私和留存策略
- `docs/reference/external-services.md`：AI Provider、官方数据来源和域名暴露方式
- `docs/reference/verification.md`：测试、构建、数据校验和上线检查
- `docs/plans/`：阶段性实施计划
- `docs/reports/`：调研、验证、上线或事故记录

不要创建空文档占位；只有当内容已经稳定、有复用价值时再新增。
