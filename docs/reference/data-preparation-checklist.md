# 数据准备清单

## 目标

第一阶段只准备河南省出分后正式筛志愿需要的数据，范围为近三年本科批和国家专项计划。先人工整理 CSV/Excel，后续再考虑半自动导入。

数据宁可少一点、准一点、来源清楚一点，不要一开始追求全量但无法核验。

## 准备顺序

### 1. 河南近三年一分一段表

用途：

- 根据分数确认位次。
- 校验用户输入的分数和位次是否明显不一致。
- 支持位次法筛选。

建议文件：

```text
score_segments_河南_2023.csv
score_segments_河南_2024.csv
score_segments_河南_2025.csv
```

建议字段：

```text
year
province
subject_type
score
same_score_count
cumulative_count
source_name
source_url
source_published_at
notes
```

采集要求：

- `province` 固定为 `河南`。
- `subject_type` 使用河南新高考官方口径枚举：`物理类` / `历史类`。这是 2025 年河南一分一段表、招生计划、专业选科要求的官方表述，权威、可追溯。
- 用户口语可能说"理科 / 文科 / 物理类 / 历史类"，采集和解析时需做归一化映射，全部落到 `物理类 / 历史类`。
- 数据展示与 AI 回复默认使用 `物理类 / 历史类`；如需照顾老高考考生，再补口语化解释（"物理类≈传统理科，历史类≈传统文科"）。
- 河南新高考下传统"一本/二本"已合并为"本科批"，专科批单列；该口径同步适用于批次相关字段。
- `cumulative_count` 是关键字段，必须仔细核对。
- 保留官方来源链接和发布时间。

### 2. 河南近三年普通本科批投档/录取数据

用途：

- 普通本科批候选筛选。
- 冲稳保分层。
- 学校、专业、计划类型风险分析。

建议文件：

```text
admission_records_河南_普通本科批_2023.csv
admission_records_河南_普通本科批_2024.csv
admission_records_河南_普通本科批_2025.csv
```

建议字段：

```text
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
notes
```

采集要求：

- `batch` 使用 `本科批`。
- `plan_type` 使用 `普通本科批`。
- 如果官方数据没有专业组或专业字段，保留为空，不要猜。
- 如果只有院校投档线，就按院校粒度录入，并在 `notes` 标明来源粒度。
- `min_rank` 比 `min_score` 更重要，缺失时要标记。

### 3. 河南近三年国家专项计划数据

用途：

- 有国家专项资格考生的候选筛选。
- 与普通本科批区分风险和机会。

建议文件：

```text
admission_records_河南_国家专项计划_2023.csv
admission_records_河南_国家专项计划_2024.csv
admission_records_河南_国家专项计划_2025.csv
```

建议字段同普通本科批。

采集要求：

- `plan_type` 使用 `国家专项计划`。
- 不要和普通本科批混在同一条记录里。
- 记录国家专项对应的批次、资格说明和来源。
- 如果国家专项数据只有院校层级，也如实保留来源粒度。

### 4. 当年招生计划

用途：

- 判断计划增减。
- 判断学校、专业、专业组、专项计划是否仍招生。
- 辅助识别新增、撤销、缩招、扩招风险。

建议文件：

```text
enrollment_plans_河南_2026.csv
```

建议字段：

```text
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
notes
```

采集要求：

- 当年招生计划优先级高于往年趋势。
- `plan_count`、`plan_type`、`subject_type` 必须核对。
- 中外合作、定向、单列、较高收费等特殊类型要写入 `notes` 或 `requirements`。

### 5. 招生章程和硬性限制

用途：

- 检查体检限制、单科要求、外语语种、调剂规则、校区、学费等。
- 生成“必须核验事项”。

第一版不需要全量抓取所有高校章程。建议只给候选学校补齐。

建议文件：

```text
school_documents_招生章程_2026.csv
```

建议字段：

```text
year
school_code
school_name
doc_type
title
source_name
source_url
published_at
content
notes
```

采集要求：

- `doc_type` 使用 `招生章程`、`招生计划`、`专业介绍`、`就业质量报告` 等。
- `content` 可以先保存摘要或关键条款，不必一开始存全文。
- 对体检、单科、外语、学费、校区、调剂等条款做人工标注。

## 可后置数据

以下数据有价值，但不建议第一阶段阻塞 MVP：

- 全量专业介绍。
- 全量就业质量报告。
- 历年专业录取平均分。
- 学校保研率、升学率、就业单位明细。
- 城市产业资料。
- 专业红黑榜或就业趋势榜单。

这些内容可以后续进入文档 RAG，但不能替代官方录取数据。

## 文件命名建议

```text
data-prep/
  raw/
    2023/
    2024/
    2025/
    2026/
  normalized/
    score_segments_河南_2023.csv
    admission_records_河南_普通本科批_2023.csv
    admission_records_河南_国家专项计划_2023.csv
    enrollment_plans_河南_2026.csv
```

`raw/` 保存原始下载文件或截图来源，`normalized/` 保存清洗后的 CSV。真实数据是否进入 Git 后续再定；默认建议原始大文件和私有整理表不提交。

## 质量检查

每批数据导入前至少检查：

- 年份、批次、计划类型是否一致。
- 分数和位次是否为数字。
- 同一学校/专业/计划类型是否重复。
- `min_rank` 是否缺失。
- 来源链接是否可打开。
- 国家专项和普通本科批是否混淆。
- 中外合作、定向、单列、较高收费等特殊类型是否被标注。

## 第一版最小可用数据包

如果时间紧，先准备：

```text
近三年一分一段表
近三年普通本科批投档/录取数据
近三年国家专项计划投档/录取数据
2026 当年招生计划
候选学校招生章程关键条款
```

拿到这些后，就可以做一个真正有价值的河南本科批志愿辅助 MVP。
