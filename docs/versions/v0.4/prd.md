# KnowNest V0.4 PRD

## 1. 文档说明

| 项目 | 内容 |
|---|---|
| 产品名称 | KnowNest |
| 版本 | V0.4 |
| 版本主题 | AI 类型模板化整理 |
| 当前状态 | 需求设计稿 |
| 完整需求来源 | `docs/KnowNest_V0.4_PRD.md` |
| 版本目录 | `docs/versions/v0.4/` |

本文档是 V0.4 版本目录内的 PRD 入口文件。完整需求以 `docs/KnowNest_V0.4_PRD.md` 为准；本目录下的 `technical-design.md`、`implementation-plan.md` 和 `acceptance-checklist.md` 均基于该 PRD 生成。

后续如果需要整理 docs 根目录结构，可以将 `docs/KnowNest_V0.4_PRD.md` 迁移为本文件的完整正文，并把原路径改为跳转说明或删除旧副本。

---

## 2. V0.4 核心目标

V0.4 的目标是把 V0.3 的 AI 知识整理能力升级为按知识类型进行模板化整理：

```txt
类型决定模板结构
分类提供领域上下文
标签提供关键词补充
AI 负责按模板整理
用户预览后再应用
```

用户可以先自由输入内容，再让 AI 根据当前知识类型匹配模板，将正文整理为适合长期保存的结构化 Markdown。

---

## 3. 本版本必做范围

V0.4 必做功能：

1. 模板管理模块。
2. 类型绑定默认模板。
3. 内置 8 个默认类型模板。
4. 编辑页展示当前匹配模板。
5. AI 按当前模板整理。
6. AI 整理前后对比。
7. AI 结果分区应用。

V0.4 延续 V0.3 的安全边界：

1. 前端不得直接调用模型 Provider。
2. AI Provider API Key 只能存在服务端环境变量中。
3. `/api/ai` 只返回候选结果，不直接覆盖知识数据。
4. 所有应用动作必须校验当前用户和知识归属。
5. AI 日志只保存元信息，不保存完整正文。

V0.4 需求收紧项：

1. 类型默认模板和全局默认模板必须有数据库唯一性约束。
2. 模板正文必须能解析出 H2 段落清单。
3. AI 整理后的正文 H2 段落必须与模板 H2 清单完全一致且顺序一致。
4. AI 输出必须经过运行时 schema 校验，非法 JSON 或结构不一致不能进入预览。
5. 模板 `aiInstructions` 视为不可信用户输入，不能覆盖 system prompt 安全边界。
6. AI 自动推荐模板不进入 V0.4。

---

## 4. 相关文档

| 文档 | 说明 |
|---|---|
| `docs/KnowNest_V0.4_PRD.md` | V0.4 完整需求文档 |
| `docs/versions/v0.4/technical-design.md` | V0.4 技术设计 |
| `docs/versions/v0.4/implementation-plan.md` | V0.4 实施计划 |
| `docs/versions/v0.4/acceptance-checklist.md` | V0.4 验收与自测清单 |
