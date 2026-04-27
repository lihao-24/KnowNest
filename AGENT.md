# KnowNest Agent Guide

- 默认用中文简洁回复，关键节点同步进展。
- 每次只做用户明确指定的任务，不顺手扩展功能或重构。
- 开始前阅读相关文档和现有代码，先看 `docs/technical/agent-context.md`。
- 尊重现有改动，不覆盖、不回滚无关文件。
- V0.1 范围内开发：Next.js App Router、TypeScript、Tailwind CSS；不要提前接入范围外能力。
- 不主动新增文档、依赖、目录、抽象或全局状态；确有必要时先说明原因。
- 中文文件按 UTF-8 读取和修改，发现乱码先停止判断。
- Windows 下优先使用 `npm.cmd` / `npx.cmd`，避免 PowerShell 拦截 `.ps1`。
- 注意 npm 包名必须小写；环境级警告先判断是否影响项目本身。
- 修改后运行与变更相关的最小验证；交付时说明改动、验证结果和剩余问题。
