# KnowNest V0.3 需求文档

## 1. 文档信息

| 项目 | 内容 |
|---|---|
| 产品名称 | KnowNest |
| 版本 | V0.3 |
| 当前状态 | 待开发 |
| 前置版本 | V0.2 已完成并上线 |
| 版本定位 | AI 知识助手 MVP |
| 核心目标 | 接入 DeepSeek API，让 KnowNest 具备 AI 辅助整理、总结、分类和优化知识内容的能力 |

---

## 2. 版本背景

KnowNest V0.1 已完成基础知识管理能力，包括用户认证、知识新增、编辑、删除和 Vercel 部署。

KnowNest V0.2 已完成知识管理体验增强，包括搜索、标签、分类、列表优化、详情页优化和 Supabase RLS 权限检查。

V0.3 是 KnowNest 的关键阶段。本版本的目标不是继续做普通 CRUD 功能，而是让 KnowNest 开始具备 AI 知识助手能力。

V0.3 的核心变化是：

```txt
从“用户手动整理知识”
升级为
“AI 辅助用户整理知识”
```

本版本首发接入 **DeepSeek API**。DeepSeek API 使用与 OpenAI / Anthropic 兼容的 API 格式；在 OpenAI 兼容模式下，`base_url` 使用：

```txt
https://api.deepseek.com
```

本项目 V0.3 优先使用：

```txt
deepseek-v4-flash
deepseek-v4-pro
```

旧模型名如 `deepseek-chat`、`deepseek-reasoner` 不作为 V0.3 新项目默认模型。

---

## 3. V0.3 核心目标

### 3.1 产品目标

V0.3 的核心目标是：

> 让 AI 帮助用户整理知识，而不是替用户接管知识。

具体包括：

1. 接入 DeepSeek API。
2. 封装服务端 AI 调用能力。
3. 支持 AI 生成摘要。
4. 支持 AI 推荐标签。
5. 支持 AI 推荐分类。
6. 支持 AI 优化标题。
7. 支持 AI 整理正文。
8. 所有 AI 结果必须经过用户预览和确认后才应用。

### 3.2 用户目标

用户在 V0.3 中应该能够：

1. 对单条知识生成摘要。
2. 根据知识内容获得标签推荐。
3. 根据知识内容获得分类推荐。
4. 根据正文生成更清晰的标题。
5. 将杂乱内容整理为结构化 Markdown 笔记。
6. 在应用 AI 结果前进行预览。
7. 保留对最终内容的控制权。
8. 不担心 AI 自动覆盖原始内容。

### 3.3 技术目标

V0.3 在技术上应完成：

1. 接入 DeepSeek API。
2. 使用服务端接口调用 AI，避免前端暴露 API Key。
3. 支持通过环境变量配置模型名称。
4. 支持 AI Provider 抽象，后续可扩展 OpenAI、Claude、Gemini、OpenRouter 等模型服务。
5. 支持结构化 JSON 返回。
6. 支持 AI 结果预览与应用。
7. 增加 AI 使用日志。
8. 增加基础使用限制。
9. 保证 Supabase RLS 和用户数据隔离不被破坏。
10. 保证 Vercel 线上环境可正常调用 AI。

---

## 4. V0.3 版本范围

### 4.1 本版本必做功能

V0.3 必做功能包括：

1. DeepSeek API 接入。
2. 服务端 AI Provider 封装。
3. 统一 AI API 接口。
4. AI 生成摘要。
5. AI 推荐标签。
6. AI 推荐分类。
7. AI 优化标题。
8. AI 整理正文。
9. AI 结果预览与应用。
10. AI 使用限制与错误处理。
11. AI 使用日志。
12. Vercel 环境变量配置与线上验证。

### 4.2 本版本可选功能

以下功能可以作为 V0.3.1 或开发顺利时加入：

1. 单条知识 AI 问答。
2. AI 提取待办事项。
3. AI 摘要过期提示。
4. AI 重新生成按钮。
5. 复制 AI 生成结果。
6. 批量为历史知识生成摘要。

### 4.3 本版本暂不做功能

为了控制 V0.3 范围，以下功能不进入本版本：

1. 全知识库 AI 问答。
2. 向量数据库。
3. embedding 检索。
4. 文件上传解析。
5. 图片 OCR。
6. 网页剪藏。
7. 浏览器插件。
8. 多模型配置中心。
9. AI 自动后台整理全部知识。
10. 多人协作。
11. 知识图谱。
12. 公开分享页。

---

## 5. AI 模型接入方案

### 5.1 接入目标

V0.3 首先要完成 AI 模型接入能力，再开发具体 AI 功能。

接入目标包括：

1. 服务端可以成功调用 DeepSeek API。
2. 前端不直接调用 DeepSeek。
3. 前端不暴露 API Key。
4. 模型名称通过环境变量配置。
5. 所有 AI 功能统一走同一套 AI Provider。
6. 后续可以平滑扩展其他模型服务商。
7. 支持本地开发环境和 Vercel 线上环境。

### 5.2 模型供应商

V0.3 首发接入：

```txt
DeepSeek API
```

选择原因：

1. 成本较低，适合个人项目长期使用。
2. DeepSeek API 兼容 OpenAI API 格式，可以使用 OpenAI SDK 接入。
3. V0.3 的主要 AI 场景是摘要、标签、分类、标题优化和正文整理，适合优先使用高性价比模型。
4. 后续如果需要更高质量或更多能力，可以在 Provider 层扩展其他模型。

### 5.3 模型选择

V0.3 推荐使用：

| 用途 | 模型 |
|---|---|
| 默认模型 | `deepseek-v4-flash` |
| 快速模型 | `deepseek-v4-flash` |
| 高质量模型 | `deepseek-v4-pro` |

### 5.4 模型使用策略

| AI 功能 | 推荐模型 |
|---|---|
| AI 生成摘要 | `deepseek-v4-flash` |
| AI 推荐标签 | `deepseek-v4-flash` |
| AI 推荐分类 | `deepseek-v4-flash` |
| AI 优化标题 | `deepseek-v4-flash` |
| AI 整理正文 | 默认 `deepseek-v4-flash`，必要时可切换 `deepseek-v4-pro` |
| 后续单条知识问答 | `deepseek-v4-flash` 或 `deepseek-v4-pro` |

### 5.5 Thinking 模式策略

V0.3 建议默认关闭 Thinking。

| 场景 | Thinking |
|---|---|
| 生成摘要 | 关闭 |
| 推荐标签 | 关闭 |
| 推荐分类 | 关闭 |
| 优化标题 | 关闭 |
| 整理正文 | 默认关闭，复杂内容可考虑开启 |
| 后续单条知识问答 | 可选开启 |

原因：

1. V0.3 多数任务是文本整理，不需要复杂推理。
2. 关闭 Thinking 可以降低 token 消耗。
3. 对用户来说响应速度更重要。
4. 复杂正文整理后续可单独引入高质量模式。

### 5.6 环境变量配置

#### 本地 `.env.local`

```env
AI_PROVIDER=deepseek

DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com

AI_MODEL_FAST=deepseek-v4-flash
AI_MODEL_DEFAULT=deepseek-v4-flash
AI_MODEL_QUALITY=deepseek-v4-pro

AI_DAILY_LIMIT=20
AI_MAX_INPUT_CHARS=8000
AI_MIN_INPUT_CHARS=20
```

#### Vercel 环境变量

Vercel 中需要配置相同变量：

```txt
AI_PROVIDER
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
AI_MODEL_FAST
AI_MODEL_DEFAULT
AI_MODEL_QUALITY
AI_DAILY_LIMIT
AI_MAX_INPUT_CHARS
AI_MIN_INPUT_CHARS
```

#### 安全要求

禁止使用：

```env
NEXT_PUBLIC_DEEPSEEK_API_KEY=xxx
```

原因是 `NEXT_PUBLIC_` 前缀会暴露给前端。

### 5.7 AI Provider 抽象

虽然 V0.3 首发只接入 DeepSeek，但代码结构应预留 Provider 抽象。

推荐定义：

```ts
export type AIAction =
  | "generate_summary"
  | "suggest_tags"
  | "suggest_category"
  | "improve_title"
  | "organize_content";

export interface GenerateAIParams {
  action: AIAction;
  title?: string;
  content: string;
  existingTags?: string[];
  existingCategories?: string[];
}

export interface AIProvider {
  generate(params: GenerateAIParams): Promise<unknown>;
}
```

V0.3 首版实现：

```txt
DeepSeekProvider
```

后续可扩展：

```txt
OpenAIProvider
ClaudeProvider
GeminiProvider
OpenRouterProvider
LocalModelProvider
```

### 5.8 推荐目录结构

如果项目是 Next.js，建议新增：

```txt
src/
  lib/
    ai/
      config.ts
      provider.ts
      deepseek.ts
      prompts.ts
      schemas.ts
      errors.ts
  app/
    api/
      ai/
        route.ts
```

| 文件 | 作用 |
|---|---|
| `config.ts` | 读取 AI 环境变量 |
| `provider.ts` | 定义通用 AI Provider 接口 |
| `deepseek.ts` | 封装 DeepSeek API 调用 |
| `prompts.ts` | 管理各 AI 功能 Prompt |
| `schemas.ts` | 管理 JSON 返回结构 |
| `errors.ts` | 统一 AI 错误处理 |
| `route.ts` | 统一 AI API 路由 |

### 5.9 DeepSeek 调用方式

DeepSeek API 兼容 OpenAI 格式，因此可以使用 OpenAI SDK 并修改 `baseURL`。

示例封装：

```ts
import OpenAI from "openai";

export const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});
```

示例调用：

```ts
const completion = await deepseekClient.chat.completions.create({
  model: process.env.AI_MODEL_DEFAULT || "deepseek-v4-flash",
  messages: [
    {
      role: "system",
      content: "你是 KnowNest 的 AI 知识整理助手。请严格返回 json。",
    },
    {
      role: "user",
      content: prompt,
    },
  ],
  response_format: {
    type: "json_object",
  },
  thinking: {
    type: "disabled",
  },
  stream: false,
});
```

说明：

1. `DEEPSEEK_API_KEY` 只能在服务端读取。
2. `DEEPSEEK_BASE_URL` 默认使用 `https://api.deepseek.com`。
3. 模型名从环境变量读取，不要写死在业务代码中。
4. JSON 输出需要在 prompt 中明确要求返回 `json`。
5. 服务端必须处理 DeepSeek 返回空内容、非 JSON 内容和请求失败等情况。

---

## 6. AI 服务设计

### 6.1 API 设计

V0.3 建议使用统一接口：

```txt
POST /api/ai
```

不建议为每个 AI 功能单独创建接口，原因是：

1. 权限校验可以统一。
2. 使用限制可以统一。
3. 日志记录可以统一。
4. 错误处理可以统一。
5. 后续扩展 action 更方便。

### 6.2 请求参数

```json
{
  "action": "generate_summary",
  "knowledgeItemId": "uuid",
  "title": "可选标题",
  "content": "可选正文"
}
```

### 6.3 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `action` | string | 是 | AI 操作类型 |
| `knowledgeItemId` | string | 否 | 知识 ID |
| `title` | string | 否 | 当前标题 |
| `content` | string | 否 | 当前正文 |

说明：

1. 如果用户在详情页调用 AI，可以基于已保存的 `knowledgeItemId` 获取内容。
2. 如果用户在编辑页尚未保存内容，可以直接传入当前编辑器中的 `title` 和 `content`。
3. 如果同时传入 `knowledgeItemId` 和 `content`，优先使用当前编辑器内容，但仍需校验知识归属权限。

### 6.4 action 类型

V0.3 首版支持：

```txt
generate_summary
suggest_tags
suggest_category
improve_title
organize_content
```

后续可扩展：

```txt
ask_current_note
extract_todos
generate_flashcard
```

### 6.5 返回结构

#### 生成摘要

```json
{
  "summary": "这是一段 AI 生成的摘要。"
}
```

#### 推荐标签

```json
{
  "tags": ["Supabase", "RLS", "数据库权限"]
}
```

#### 推荐分类

```json
{
  "category": "项目",
  "reason": "这条知识主要记录项目开发中的技术实现细节。"
}
```

#### 优化标题

```json
{
  "title": "Supabase RLS 权限策略配置笔记"
}
```

#### 整理正文

```json
{
  "content": "## 背景\n\n...\n\n## 核心内容\n\n..."
}
```

### 6.6 服务端校验要求

每次 AI 请求必须校验：

1. 用户是否登录。
2. 用户是否有权访问该知识。
3. 输入内容是否为空。
4. 输入内容是否过短。
5. 输入内容是否过长。
6. 是否达到每日 AI 使用限制。
7. AI Provider 是否配置完成。
8. API Key 是否存在。
9. AI 返回内容是否可解析。
10. 返回 JSON 是否符合当前 action 的结构要求。

---

## 7. AI 功能需求

### 7.1 AI 生成摘要

#### 功能说明

用户可以对单条知识生成 AI 摘要。

摘要用于：

1. 快速理解知识内容。
2. 在详情页展示。
3. 在列表页作为内容预览。
4. 后续作为知识检索和问答的基础信息。

#### 入口位置

建议在以下位置提供入口：

1. 知识详情页。
2. 知识编辑页。

#### 交互流程

```txt
用户打开知识详情页或编辑页
点击“生成摘要”
系统进入 loading 状态
服务端调用 DeepSeek API
AI 返回摘要
前端展示摘要预览
用户点击“应用摘要”
系统保存摘要到当前知识
```

#### 摘要要求

1. 长度建议 80 到 150 字。
2. 语言简洁。
3. 不添加原文没有的信息。
4. 不使用夸张表达。
5. 适合作为列表页预览内容。

#### 验收标准

| 编号 | 验收项 |
|---|---|
| AI-S-01 | 用户可以点击按钮生成摘要 |
| AI-S-02 | 摘要生成过程中有 loading 状态 |
| AI-S-03 | 生成成功后可以预览摘要 |
| AI-S-04 | 用户点击应用后，摘要保存到当前知识 |
| AI-S-05 | 用户未点击应用时，不修改原数据 |
| AI-S-06 | 摘要只基于当前知识内容生成 |
| AI-S-07 | 空正文或过短正文时给出提示 |
| AI-S-08 | AI 请求失败时展示错误提示 |

---

### 7.2 AI 推荐标签

#### 功能说明

用户可以让 AI 根据知识标题和正文推荐标签。

AI 推荐标签需要与 V0.2 的标签系统结合。

#### 推荐规则

1. 推荐 3 到 5 个标签。
2. 标签名称应简短。
3. 标签应尽量复用已有标签。
4. 不推荐过于泛化的标签，例如“知识”“内容”“笔记”。
5. AI 只推荐标签，不自动保存。
6. 用户确认后，系统才创建或绑定标签。

#### 交互流程

```txt
用户点击“推荐标签”
系统读取当前知识标题和正文
系统读取用户已有标签列表
服务端调用 DeepSeek API
AI 返回标签列表
前端展示推荐标签
用户勾选需要的标签
用户点击“添加到知识”
系统创建缺失标签并绑定到当前知识
```

#### 验收标准

| 编号 | 验收项 |
|---|---|
| AI-T-01 | 用户可以点击按钮推荐标签 |
| AI-T-02 | AI 可以返回 3 到 5 个标签 |
| AI-T-03 | 推荐结果可以预览 |
| AI-T-04 | 用户可以选择部分标签应用 |
| AI-T-05 | 已存在标签不会重复创建 |
| AI-T-06 | 新标签可以正确创建 |
| AI-T-07 | 标签绑定到当前知识 |
| AI-T-08 | 用户未确认时，不修改标签数据 |

---

### 7.3 AI 推荐分类

#### 功能说明

用户可以让 AI 根据知识内容推荐一个分类。

AI 推荐分类需要与 V0.2 的分类系统结合。

#### 推荐规则

1. AI 优先从用户已有分类中推荐。
2. 如果没有合适分类，可以推荐“其他”。
3. V0.3 不建议让 AI 自动创建分类。
4. 用户确认后，才更新知识分类。

#### 交互流程

```txt
用户点击“推荐分类”
系统读取标题、正文和已有分类列表
服务端调用 DeepSeek API
AI 返回推荐分类和原因
前端展示推荐结果
用户点击“应用分类”
系统更新当前知识分类
```

#### 验收标准

| 编号 | 验收项 |
|---|---|
| AI-C-01 | 用户可以点击按钮推荐分类 |
| AI-C-02 | AI 可以从已有分类中推荐一个分类 |
| AI-C-03 | 推荐结果展示推荐原因 |
| AI-C-04 | 用户确认后分类才会更新 |
| AI-C-05 | 用户取消时不修改分类 |
| AI-C-06 | 没有合适分类时可以推荐“其他”或不推荐 |

---

### 7.4 AI 优化标题

#### 功能说明

用户可以让 AI 根据知识正文生成更清晰、更适合知识库管理的标题。

#### 标题要求

1. 简洁清晰。
2. 准确反映正文主题。
3. 不超过 30 个中文字符。
4. 不使用标题党表达。
5. 不添加正文中不存在的信息。

#### 交互流程

```txt
用户点击“优化标题”
服务端调用 DeepSeek API
AI 返回推荐标题
前端展示标题预览
用户点击“替换标题”
系统更新当前知识标题
```

#### 验收标准

| 编号 | 验收项 |
|---|---|
| AI-H-01 | 用户可以点击按钮优化标题 |
| AI-H-02 | AI 返回一个推荐标题 |
| AI-H-03 | 用户可以预览标题 |
| AI-H-04 | 用户确认后才替换原标题 |
| AI-H-05 | 用户取消时保留原标题 |
| AI-H-06 | 标题为空或正文过短时给出提示 |

---

### 7.5 AI 整理正文

#### 功能说明

用户可以让 AI 将当前知识正文整理成更清晰的结构化 Markdown 笔记。

这是 V0.3 中最重要的内容质量提升功能。

#### 整理目标

AI 应将原始内容整理为更容易阅读和复用的结构。

推荐结构：

```md
## 背景

## 核心内容

## 关键步骤

## 注意事项

## 后续行动
```

实际结构不需要每次完全一致，应根据内容自动调整。

#### 交互流程

```txt
用户点击“整理正文”
服务端调用 DeepSeek API
AI 返回整理后的 Markdown 内容
前端展示整理结果预览
用户选择：
- 追加到正文下方
- 替换原正文
- 取消
```

#### 安全要求

1. 默认不自动覆盖正文。
2. 优先提供“追加到正文下方”。
3. 替换正文时需要二次确认。
4. 用户未确认前，原始正文不能被修改。
5. AI 请求失败不能影响原正文。

#### 验收标准

| 编号 | 验收项 |
|---|---|
| AI-B-01 | 用户可以点击按钮整理正文 |
| AI-B-02 | AI 返回 Markdown 格式内容 |
| AI-B-03 | 整理结果可以预览 |
| AI-B-04 | 用户可以选择追加到正文 |
| AI-B-05 | 用户可以选择替换正文 |
| AI-B-06 | 替换正文前需要确认 |
| AI-B-07 | 用户取消时不修改正文 |
| AI-B-08 | 正文为空时不允许整理 |

---

## 8. AI 结果预览与应用

### 8.1 基本原则

所有 AI 结果必须先展示给用户确认。

禁止：

```txt
AI 生成后自动覆盖标题
AI 生成后自动覆盖正文
AI 生成后自动创建大量标签
AI 生成后自动修改分类
```

允许：

```txt
AI 生成结果
用户预览
用户点击应用
系统保存
```

### 8.2 预览操作

AI 返回结果后，前端应提供：

| 操作 | 是否必做 |
|---|---|
| 应用 | 必做 |
| 取消 | 必做 |
| 重新生成 | 可选 |
| 复制结果 | 可选 |

### 8.3 不同功能的应用方式

| 功能 | 应用方式 |
|---|---|
| 生成摘要 | 保存到 `summary` 字段 |
| 推荐标签 | 用户选择后创建或绑定标签 |
| 推荐分类 | 更新当前知识的 `category_id` |
| 优化标题 | 替换 `title` |
| 整理正文 | 追加到正文或替换正文 |

---

## 9. 页面与交互设计

### 9.1 知识编辑页

编辑页增加 AI 助手区域。

建议布局：

```txt
标题输入框

正文编辑区

标签 / 分类区域

AI 助手：
[生成摘要] [推荐标签] [推荐分类] [优化标题] [整理正文]

AI 结果预览区域

保存按钮
```

### 9.2 知识详情页

详情页增加 AI 摘要展示和 AI 操作入口。

建议布局：

```txt
标题
分类 / 标签 / 更新时间

AI 摘要

正文内容

AI 助手：
[生成摘要] [推荐标签] [整理正文]
```

如果没有摘要，展示：

```txt
暂无 AI 摘要，点击生成
```

### 9.3 知识列表页

知识卡片展示逻辑调整为：

```txt
标题
AI 摘要 / 正文截断摘要
标签
分类
更新时间
```

优先展示 AI 摘要。

如果没有 AI 摘要，则展示正文截断内容。

---

## 10. 数据结构设计

### 10.1 修改知识表：`knowledge_items`

建议新增字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `summary` | text / nullable | AI 生成摘要 |
| `summary_generated_at` | timestamp / nullable | 摘要生成时间 |
| `ai_updated_at` | timestamp / nullable | 最近一次 AI 应用时间 |

可选字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `summary_source_hash` | text / nullable | 生成摘要时对应的正文 hash，用于判断摘要是否过期 |
| `ai_last_action` | text / nullable | 最近一次 AI 操作类型 |

### 10.2 新增 AI 使用日志表：`ai_usage_logs`

建议新增表：

```txt
ai_usage_logs
```

字段设计：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid | 主键 |
| `user_id` | uuid | 用户 ID |
| `knowledge_item_id` | uuid / nullable | 对应知识 ID |
| `action_type` | text | AI 操作类型 |
| `model` | text | 使用的模型 |
| `status` | text | success / failed |
| `input_length` | integer | 输入文本长度 |
| `output_length` | integer | 输出文本长度 |
| `error_message` | text / nullable | 错误信息 |
| `created_at` | timestamp | 创建时间 |

### 10.3 action_type 枚举建议

```txt
generate_summary
suggest_tags
suggest_category
improve_title
organize_content
ask_current_note
extract_todos
```

V0.3 首版至少支持：

```txt
generate_summary
suggest_tags
suggest_category
improve_title
organize_content
```

### 10.4 RLS 要求

`ai_usage_logs` 必须启用 RLS。

权限要求：

| 操作 | 权限 |
|---|---|
| select | 用户只能查看自己的 AI 使用记录 |
| insert | 用户只能插入自己的 AI 使用记录 |
| update | 默认不允许 |
| delete | 默认不允许 |

---

## 11. Prompt 设计要求

### 11.1 通用要求

所有 Prompt 应满足：

1. 使用用户当前语言输出。
2. 不编造原文没有的信息。
3. 不输出无关解释。
4. 必须返回 JSON。
5. 标签要简洁。
6. 摘要要适合知识库列表展示。
7. 整理正文时保持原意，不改变事实。

### 11.2 摘要 Prompt

输入：

```txt
标题
正文
```

输出：

```json
{
  "summary": "..."
}
```

要求：

```txt
请为这条知识生成 80 到 150 字摘要。
摘要应准确、简洁，不添加原文没有的信息。
必须返回 json。
```

### 11.3 标签 Prompt

输入：

```txt
标题
正文
已有标签列表
```

输出：

```json
{
  "tags": ["标签1", "标签2", "标签3"]
}
```

要求：

```txt
请推荐 3 到 5 个适合这条知识的标签。
优先复用已有标签。
标签应简短具体，避免过于宽泛。
必须返回 json。
```

### 11.4 分类 Prompt

输入：

```txt
标题
正文
已有分类列表
```

输出：

```json
{
  "category": "分类名",
  "reason": "推荐原因"
}
```

要求：

```txt
请从已有分类中选择最适合的一个分类。
如果没有合适分类，请返回“其他”。
必须返回 json。
```

### 11.5 标题 Prompt

输入：

```txt
当前标题
正文
```

输出：

```json
{
  "title": "..."
}
```

要求：

```txt
请为这条知识生成一个更清晰的标题。
标题不超过 30 个中文字符。
不要使用夸张表达。
不要添加正文不存在的信息。
必须返回 json。
```

### 11.6 正文整理 Prompt

输入：

```txt
标题
正文
```

输出：

```json
{
  "content": "..."
}
```

要求：

```txt
请将这条知识整理为结构清晰的 Markdown 笔记。
保持原意，不添加原文没有的信息。
可以根据内容使用标题、列表、步骤、注意事项等结构。
必须返回 json。
```

---

## 12. 使用限制与安全

### 12.1 使用限制

V0.3 建议设置基础限制：

| 限制项 | 建议值 |
|---|---|
| 单个用户每日 AI 请求次数 | 20 次 |
| 单次正文最大长度 | 8000 字符 |
| 单次正文最小长度 | 20 字符 |
| 失败重试 | 用户手动重试 |
| 并发请求 | 同一页面一次只允许一个 AI 请求 |

### 12.2 权限要求

所有 AI 请求都必须验证：

1. 用户已登录。
2. 用户只能对自己的知识调用 AI。
3. 用户不能通过 `knowledgeItemId` 获取他人知识内容。
4. AI 生成结果只能保存到当前用户自己的知识中。
5. AI 使用日志只能记录到当前用户下。

### 12.3 隐私要求

1. 不在前端暴露 DeepSeek API Key。
2. 不在日志中保存完整正文。
3. 错误日志中不要记录敏感正文内容。
4. AI 使用记录只保存必要元信息。
5. 用户内容仅用于本次 AI 生成。
6. 不将用户内容用于额外的后台训练或分析逻辑。

---

## 13. 错误处理

### 13.1 需要处理的错误场景

| 场景 | 处理方式 |
|---|---|
| 用户未登录 | 返回 401 |
| 用户无权访问知识 | 返回 403 |
| 正文为空 | 提示“请先输入正文内容” |
| 正文过短 | 提示“内容过短，无法生成” |
| 正文过长 | 提示“内容过长，请缩短后重试” |
| API Key 缺失 | 服务端返回配置错误 |
| DeepSeek 请求失败 | 展示生成失败提示 |
| DeepSeek 返回空内容 | 提示重新生成 |
| JSON 解析失败 | 提示结果格式异常 |
| 达到每日限制 | 提示今日 AI 使用次数已达上限 |
| 网络异常 | 提示稍后重试 |

### 13.2 前端状态

每个 AI 操作至少包含：

```txt
idle
loading
success
error
applying
applied
```

---

## 14. 开发阶段拆解

### 阶段一：DeepSeek 模型接入

#### 任务

1. 申请 DeepSeek API Key。
2. 配置本地 `.env.local`。
3. 配置 Vercel 环境变量。
4. 安装或确认 OpenAI SDK。
5. 新增 AI 配置模块。
6. 新增 DeepSeek Provider。
7. 完成最小模型调用测试。
8. 完成 JSON 返回测试。

#### 交付结果

1. 本地可以成功调用 DeepSeek。
2. Vercel 环境变量配置完成。
3. 服务端可以拿到结构化 JSON 返回。
4. API Key 不暴露给前端。

### 阶段二：统一 AI API

#### 任务

1. 新增 `POST /api/ai`。
2. 支持 `action` 参数。
3. 统一用户认证校验。
4. 统一知识归属校验。
5. 统一输入长度校验。
6. 统一调用 DeepSeek Provider。
7. 统一错误返回格式。

#### 交付结果

1. 前端可以通过 `/api/ai` 调用所有 AI 功能。
2. 所有 AI 请求都有统一权限和错误处理。

### 阶段三：数据库调整

#### 任务

1. 为 `knowledge_items` 新增摘要相关字段。
2. 新增 `ai_usage_logs` 表。
3. 为 `ai_usage_logs` 启用 RLS。
4. 增加 AI 使用次数查询逻辑。
5. 增加日志写入逻辑。

#### 交付结果

1. 摘要可以保存到知识中。
2. AI 使用记录可以写入。
3. 每日使用限制可以生效。
4. 用户数据隔离正常。

### 阶段四：AI 摘要功能

#### 任务

1. 在详情页增加“生成摘要”按钮。
2. 在编辑页增加“生成摘要”按钮。
3. 实现摘要生成接口调用。
4. 实现摘要预览。
5. 实现应用摘要。
6. 在详情页展示摘要。
7. 在列表页展示摘要。

#### 交付结果

1. 用户可以生成并保存摘要。
2. 摘要可在详情页和列表页展示。

### 阶段五：AI 标签与分类

#### 任务

1. 实现推荐标签功能。
2. 读取用户已有标签作为 AI 上下文。
3. 实现标签预览与选择。
4. 用户确认后创建或绑定标签。
5. 实现推荐分类功能。
6. 读取用户已有分类作为 AI 上下文。
7. 用户确认后更新分类。

#### 交付结果

1. 用户可以让 AI 推荐标签。
2. 用户可以选择并应用标签。
3. 用户可以让 AI 推荐分类。
4. 用户确认后分类更新成功。

### 阶段六：AI 标题与正文整理

#### 任务

1. 实现 AI 优化标题。
2. 实现推荐标题预览。
3. 用户确认后替换标题。
4. 实现 AI 整理正文。
5. 展示 Markdown 整理结果。
6. 支持追加到正文。
7. 支持替换正文。
8. 替换正文前增加二次确认。

#### 交付结果

1. 用户可以优化标题。
2. 用户可以整理正文。
3. 原文不会被意外覆盖。

### 阶段七：测试与部署

#### 任务

1. 测试所有 AI 功能。
2. 测试空内容、短内容、长内容。
3. 测试 DeepSeek 请求失败。
4. 测试 JSON 解析失败。
5. 测试未登录访问。
6. 测试用户数据隔离。
7. 测试每日使用限制。
8. 测试移动端展示。
9. 测试 Vercel 环境变量。
10. 部署到 Vercel。

#### 交付结果

1. V0.3 功能稳定。
2. AI 功能可在正式环境使用。
3. 不影响 V0.1 和 V0.2 已有功能。

---

## 15. V0.3 验收清单

### 15.1 模型接入验收

| 编号 | 验收项 | 状态 |
|---|---|---|
| M-01 | 项目支持通过环境变量配置 AI Provider | 待验收 |
| M-02 | 项目支持通过环境变量配置默认模型 | 待验收 |
| M-03 | DeepSeek API Key 只在服务端读取 | 待验收 |
| M-04 | 前端代码中没有暴露 API Key | 待验收 |
| M-05 | 本地环境可以成功调用 DeepSeek API | 待验收 |
| M-06 | Vercel 环境可以成功调用 DeepSeek API | 待验收 |
| M-07 | AI 返回结果为结构化 JSON | 待验收 |
| M-08 | 模型调用失败时有错误提示 | 待验收 |
| M-09 | 更换模型名称不需要修改业务代码 | 待验收 |
| M-10 | 默认使用 `deepseek-v4-flash` | 待验收 |

### 15.2 AI 摘要验收

| 编号 | 验收项 | 状态 |
|---|---|---|
| A-01 | 用户可以生成 AI 摘要 | 待验收 |
| A-02 | 摘要生成后可以预览 | 待验收 |
| A-03 | 用户确认后摘要保存成功 | 待验收 |
| A-04 | 摘要展示在详情页 | 待验收 |
| A-05 | 摘要展示在列表页 | 待验收 |
| A-06 | 失败时不会修改原内容 | 待验收 |

### 15.3 AI 标签验收

| 编号 | 验收项 | 状态 |
|---|---|---|
| A-07 | 用户可以生成推荐标签 | 待验收 |
| A-08 | 推荐标签可以预览 | 待验收 |
| A-09 | 用户可以选择部分标签应用 | 待验收 |
| A-10 | 已有标签不会重复创建 | 待验收 |
| A-11 | 新标签可以创建并绑定 | 待验收 |

### 15.4 AI 分类验收

| 编号 | 验收项 | 状态 |
|---|---|---|
| A-12 | 用户可以生成推荐分类 | 待验收 |
| A-13 | AI 从已有分类中推荐 | 待验收 |
| A-14 | 推荐原因可以展示 | 待验收 |
| A-15 | 用户确认后分类更新成功 | 待验收 |

### 15.5 AI 标题与正文验收

| 编号 | 验收项 | 状态 |
|---|---|---|
| A-16 | 用户可以优化标题 | 待验收 |
| A-17 | 用户确认后标题才替换 | 待验收 |
| A-18 | 用户可以整理正文 | 待验收 |
| A-19 | 整理结果为 Markdown 格式 | 待验收 |
| A-20 | 用户可以追加整理结果 | 待验收 |
| A-21 | 用户可以替换正文 | 待验收 |
| A-22 | 替换正文前有确认 | 待验收 |

### 15.6 权限与安全验收

| 编号 | 验收项 | 状态 |
|---|---|---|
| A-23 | 未登录用户不能调用 AI | 待验收 |
| A-24 | 用户不能对他人知识调用 AI | 待验收 |
| A-25 | DeepSeek API Key 不暴露到前端 | 待验收 |
| A-26 | 达到每日限制后不能继续调用 | 待验收 |
| A-27 | AI 请求失败时有错误提示 | 待验收 |
| A-28 | AI 使用日志只记录当前用户数据 | 待验收 |
| A-29 | Vercel 正式环境 AI 功能可用 | 待验收 |

---

## 16. V0.3 成功标准

当以下条件全部满足时，V0.3 可以认为完成：

1. DeepSeek API 成功接入。
2. 本地和 Vercel 环境都可以调用 AI。
3. AI API Key 没有暴露到前端。
4. AI 摘要功能可稳定使用。
5. AI 推荐标签功能可稳定使用。
6. AI 推荐分类功能可稳定使用。
7. AI 优化标题功能可稳定使用。
8. AI 整理正文功能可稳定使用。
9. 所有 AI 结果都需要用户确认后才应用。
10. 原始内容不会被 AI 自动覆盖。
11. 用户只能对自己的知识使用 AI。
12. AI 使用次数限制生效。
13. V0.1 和 V0.2 的已有功能不受影响。

---

## 17. 后续版本建议

| 版本 | 方向 | 说明 |
|---|---|---|
| V0.3.1 | AI 体验增强 | 单条知识问答、提取待办、重新生成、复制结果 |
| V0.4 | 全知识库问答 | 引入 embedding、向量检索、引用来源 |
| V0.5 | 内容采集 | 文件上传、链接收藏、网页剪藏 |
| V0.6 | 知识输出 | Markdown 导出、分享页、知识卡片 |
| V0.7 | 多端体验 | PWA、移动端优化、离线能力 |

---

## 附录：给 Codex 的开发提示词

```txt
你现在接手 KnowNest V0.3 开发。

项目现状：
- V0.1 已完成并部署
- V0.2 已完成并上线
- V0.2 已包含搜索、标签、分类、列表优化、详情页优化和 Supabase RLS 权限检查
- 当前目标是开发 V0.3：AI 知识助手 MVP

V0.3 首发接入 DeepSeek API。

请先阅读当前项目代码结构、路由结构、Supabase 表结构、认证逻辑和 V0.2 已有功能实现，然后根据 docs/versions/v0.3/prd.md 进行开发。

一、模型接入要求

1. 使用 DeepSeek API。
2. DeepSeek 兼容 OpenAI API 格式，因此可以使用 openai npm sdk。
3. baseURL 使用：https://api.deepseek.com
4. 不允许前端直接调用 DeepSeek API。
5. 不允许暴露 DEEPSEEK_API_KEY。
6. DEEPSEEK_API_KEY 必须通过服务端环境变量读取。
7. 模型名称必须通过环境变量配置，不要写死在业务代码里。

推荐环境变量：

AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
AI_MODEL_FAST=deepseek-v4-flash
AI_MODEL_DEFAULT=deepseek-v4-flash
AI_MODEL_QUALITY=deepseek-v4-pro
AI_DAILY_LIMIT=20
AI_MAX_INPUT_CHARS=8000
AI_MIN_INPUT_CHARS=20

模型使用策略：

- generate_summary 使用 AI_MODEL_DEFAULT
- suggest_tags 使用 AI_MODEL_FAST
- suggest_category 使用 AI_MODEL_FAST
- improve_title 使用 AI_MODEL_FAST
- organize_content 默认使用 AI_MODEL_DEFAULT，后续可切换 AI_MODEL_QUALITY

建议新增：

src/lib/ai/config.ts
src/lib/ai/provider.ts
src/lib/ai/deepseek.ts
src/lib/ai/prompts.ts
src/lib/ai/schemas.ts
src/lib/ai/errors.ts
src/app/api/ai/route.ts

所有 AI 功能统一走：

POST /api/ai

请求 action 包括：

generate_summary
suggest_tags
suggest_category
improve_title
organize_content

AI 返回结果必须使用 JSON 格式。

DeepSeek JSON Output 需要设置：

response_format: { type: "json_object" }

并在 prompt 中明确要求返回 json。

默认关闭 thinking：

thinking: {
  type: "disabled"
}

复杂正文整理可以后续尝试开启 thinking 或切换 deepseek-v4-pro。

二、V0.3 核心功能

1. AI 生成摘要
- 用户可以对单条知识生成摘要
- 摘要需要先预览
- 用户确认后才保存
- 摘要展示在详情页和列表页

2. AI 推荐标签
- 根据知识标题和正文推荐 3 到 5 个标签
- 优先复用已有标签
- 用户可以选择部分标签应用
- 已有标签不能重复创建

3. AI 推荐分类
- 根据标题和正文，从用户已有分类中推荐一个分类
- 返回推荐原因
- 用户确认后才更新知识分类

4. AI 优化标题
- 根据正文生成更清晰的标题
- 用户预览后确认替换
- 不允许自动覆盖原标题

5. AI 整理正文
- 将正文整理成结构化 Markdown 笔记
- 用户可以选择追加到正文或替换正文
- 替换正文前需要确认
- 不允许自动覆盖原正文

三、数据库调整

1. 为 knowledge_items 增加：
- summary
- summary_generated_at
- ai_updated_at

2. 新增 ai_usage_logs 表，字段包括：
- id
- user_id
- knowledge_item_id
- action_type
- model
- status
- input_length
- output_length
- error_message
- created_at

3. 新增表必须启用 RLS。
4. 用户只能查看和插入自己的 AI 使用记录。

四、安全与限制

1. 未登录用户不能调用 AI。
2. 用户不能对其他用户的知识调用 AI。
3. 每个用户每日 AI 请求建议限制为 20 次。
4. 单次正文长度需要限制。
5. AI 请求失败时不能影响原始知识数据。
6. 不要在日志中保存完整正文。
7. 不要破坏 V0.1 和 V0.2 已有功能。

五、开发顺序

请按以下顺序开发：

1. 分析当前项目结构和数据表
2. 设计 V0.3 数据库 migration
3. 接入 DeepSeek API
4. 实现服务端 AI Provider
5. 实现最小模型调用测试
6. 实现 JSON 输出解析测试
7. 实现统一 POST /api/ai 接口
8. 实现 AI 摘要功能
9. 实现 AI 推荐标签和分类
10. 实现 AI 优化标题和整理正文
11. 补齐 loading、错误处理、权限校验、使用限制
12. 完整测试并给出部署检查清单
```
