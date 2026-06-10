# 河南数据与推荐流程

## 第一阶段数据范围

只处理河南省出分后的正式志愿辅助筛选：

- 年份：近三年。
- 批次：本科批。
- 计划类型：普通本科批、国家专项计划。
- 用途：辅助筛选、解释、对比和风险提示。

## 字段口径约定

- `subject_type`（科类）：统一使用河南新高考官方口径 `物理类` / `历史类`。
  - 用户口语"理科 / 文科"在画像解析层归一化到 `物理类 / 历史类`。
  - 数据采集、AI 回复、前端展示、志愿篮默认使用官方口径；如确需照顾老高考考生，再补一句口语化解释（"物理类≈传统理科，历史类≈传统文科"）。
- `batch`（批次）：河南新高考下传统一本/二本合并为 `本科批`，专科批单列。
- 同一字段在数据模型、规则引擎、AI prompt 和前端 UI 之间必须保持口径一致；任何口径变更需要在 AGENTS.md 中留痕。

暂不处理：

- 专科批。
- 提前批。
- 艺术、体育、强基计划、综合评价等特殊路径。
- 全国多省规则。

## 数据优先级

1. 河南省教育考试院官方数据。
2. 高校招生网、招生章程和招生计划。
3. 阳光高考等官方或权威公共平台。
4. 高校就业质量报告、学院官网等辅助资料。
5. 方法论资料和经验判断。

涉及录取、分数、位次、计划数和资格限制时，必须优先使用前两类。

## 建议数据表

当前迁移已创建以下表：

- 用户私有表：`chat_sessions`、`chat_messages`、`candidate_profiles`、`saved_choices`。
- 公共数据表：`score_segments`、`admission_records`、`enrollment_plans`、`school_documents`。
- RAG 预留表：`document_chunks`。

当前已实现 `admission_records` CSV parser 和导入脚本，`score_segments`、`enrollment_plans`、`school_documents` 的导入脚本仍待补齐。

### admission_records

记录近三年河南本科批和国家专项计划的录取或投档结果。

建议字段：

```text
id
year
province
batch
plan_type
subject_type
school_code
school_name
major_group_code
major_group_name
major_code
major_name
min_score
min_rank
avg_score
avg_rank
plan_count
source_name
source_url
source_published_at
trust_level
imported_at
notes
```

如果河南具体数据源没有专业组字段，可以保留为空，但字段名先预留，避免后续规则变化时大改模型。

### score_segments

记录河南一分一段表。

```text
id
year
province
subject_type
score
same_score_count
cumulative_count
source_name
source_url
source_published_at
trust_level
imported_at
```

### enrollment_plans

记录当年招生计划。

```text
id
year
province
batch
plan_type
subject_type
school_code
school_name
major_group_code
major_group_name
major_code
major_name
plan_count
tuition
duration
campus
requirements
source_name
source_url
source_published_at
trust_level
imported_at
notes
```

### school_documents

记录高校招生章程、专业介绍、就业质量报告等文档。

```text
id
year
school_code
school_name
doc_type
title
source_name
source_url
published_at
trust_level
content
imported_at
```

## 考生画像字段

第一版推荐流程需要：

```text
province = 河南
score
rank
subject_type
batch_line
special_control_line
eligible_national_special_plan
preferred_regions
excluded_regions
interested_majors
excluded_majors
family_resources
budget_constraints
primary_goal
```

缺少 `score`、`rank`、`subject_type`、`primary_goal` 时，不进入完整推荐，只追问或做概念解释。

## 推荐流程

当前实现状态（2026-06-10）：

- `src/lib/profile` 已支持从单轮文本中提取分数、位次、科类、国家专项资格、地域/专业偏好和核心诉求。
- `src/lib/admissions` 已支持 `admission_records` CSV header 解析、字段校验、行号/字段级错误报告和 snake_case 到 camelCase 转换。
- `fixtures/admissions/sample-admission-records.csv` 提供 12 条虚构样例记录，覆盖普通本科批、国家专项计划、物理类/历史类、冲稳保区间和缺少招生计划的风险场景；仅用于开发验证，不用于真实填报。
- `src/lib/admissions/repository.ts` 已支持数据库优先查询 `admission_records`，`DATABASE_URL=disabled` 时读取样例 CSV。
- `src/lib/recommendation` 已支持 `AdmissionRecord[]` 的河南、本科批、科类、国家专项资格过滤，以及按位次粗分“冲/稳/保”。
- `/api/chat` 已将用户消息提取出的画像、`admission_records` 查询结果和规则层候选组装为 summary，右侧候选、来源和核验事项不再依赖固定 demo 候选。
- 本地 Postgres 已验证迁移和样例 CSV 导入，当前样例 `admission_records` 入库 12 条。
- 当前仍未结合 `enrollment_plans` 和 `school_documents` 做完整风险分析，缺少当年招生计划时统一标记为待核验/缺少当年招生计划。

### 1. 画像校验

- 固定省份为河南。
- 校验分数和位次是否同时存在。
- 校验科类或选科。
- 校验是否具备国家专项计划资格。
- 校验核心诉求。

### 2. 硬条件过滤

- 只查本科批和国家专项计划。
- 没有国家专项资格时，排除国家专项计划。
- 科类或选科不匹配时排除。
- 明确排斥城市、专业、学费或特殊培养方式时排除。

### 3. 位次筛选

基于近三年 `min_rank` 计算候选范围。

第一版可以先使用保守规则：

- 冲：近三年最低位次多数优于考生位次，但差距不极端。
- 稳：近三年最低位次与考生位次接近，且波动可解释。
- 保：近三年最低位次多数低于考生位次，且计划或限制没有明显恶化。

具体阈值不要从 `xuefeng-agent` 照搬。需要结合河南近三年数据分布校准后再定。

### 4. 波动和风险分析

对候选项标记：

- 位次波动大。
- 招生计划减少。
- 专业或计划类型变化。
- 学费较高。
- 中外合作、定向、单列专业等特殊类型。
- 体检、单科、外语语种等招生章程限制。
- 城市或就业路径与用户目标不匹配。

### 5. LLM 解释

LLM 接收结构化候选和引用资料后，生成自然语言回答：

- 先说明能不能进入完整推荐。
- 信息不全时继续追问。
- 信息足够时给冲稳保候选和风险。
- 明确区分官方数据、往年趋势、经验判断。
- 给出下一步核验清单。

## 回答引用要求

涉及具体候选时，回答必须能回溯到：

- 近三年投档/录取数据。
- 当年招生计划。
- 国家专项资格或批次规则。
- 高校招生章程中的限制。

如果缺少上述数据，只能说“当前资料不足以判断”，不能补编。

## 右侧总结区建议

第一版右侧信息区展示：

- 当前考生画像。
- 已识别缺失信息。
- 已检索数据来源。
- 当前候选清单。
- 风险标签。
- 待官方核验事项。

右侧信息区是降低聊天幻觉的重要界面，不应只是装饰。
