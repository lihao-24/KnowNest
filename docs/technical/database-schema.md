# KnowNest V0.1 数据库设计文档

## 1. 文档信息

| 项目 | 内容 |
|---|---|
| 产品名称 | KnowNest |
| 中文名 | 知巢 |
| 文档名称 | V0.1 数据库设计文档 |
| 文档版本 | v0.1 |
| 数据库方案 | Supabase PostgreSQL |
| 适用阶段 | V0.1 MVP |

---

## 2. 设计目标

V0.1 数据库设计的目标是支撑 KnowNest 的基础知识库能力。

需要支持：

```text
用户登录后的个人数据隔离
知识条目 CRUD
生活 / 工作空间
收集箱 / 已整理 / 归档状态
内容类型
收藏
标签
标签筛选
基础搜索
多设备同步
后续 AI 能力扩展
```

V0.1 数据库不追求复杂，但必须保证：

1. 数据结构清晰。
2. 权限隔离可靠。
3. 后续扩展空间足够。
4. 查询和筛选方便。
5. 不为第一版引入过度设计。

---

## 3. 设计原则

### 3.1 用户数据强隔离

每一条业务数据都必须归属于某个用户。

核心表必须包含：

```text
user_id
```

并通过 Supabase Row Level Security 限制用户只能访问自己的数据。

---

### 3.2 先使用简单字段，不急于抽象

V0.1 中，空间、状态、类型使用 `text + check constraint`，而不是立即使用独立配置表。

原因：

- 初始值固定
- 查询简单
- 前端实现简单
- 后续如需自定义空间和类型，可以再迁移

---

### 3.3 标签使用关系表

标签不直接存为字符串数组，而是使用独立标签表和多对多关系表。

原因：

- 便于标签去重
- 便于标签筛选
- 便于统计标签使用次数
- 便于后续 AI 标签建议
- 便于后续做标签管理页

---

### 3.4 删除策略以真实删除为主

V0.1 删除知识条目时直接删除数据库记录。

后续如果需要回收站，可以增加软删除字段：

```text
deleted_at
```

但 V0.1 暂不实现软删除。

---

### 3.5 为后续 AI 扩展预留空间

V0.1 暂不实现 AI 表，但当前表结构应方便后续增加：

```text
ai_summaries
knowledge_embeddings
ai_conversations
```

---

## 4. 表结构总览

V0.1 需要 4 张业务表：

```text
profiles
knowledge_items
tags
knowledge_item_tags
```

关系如下：

```text
auth.users
  └── profiles
  └── knowledge_items
        └── knowledge_item_tags
              └── tags
```

### 4.1 表说明

| 表名 | 说明 |
|---|---|
| profiles | 用户资料表，对应 Supabase Auth 用户 |
| knowledge_items | 知识条目主表 |
| tags | 用户自定义标签表 |
| knowledge_item_tags | 知识条目与标签的多对多关系表 |

---

## 5. 字段枚举设计

V0.1 中以下字段使用固定值。

---

## 5.1 space

表示知识所属空间。

| 值 | 展示名 | 说明 |
|---|---|---|
| life | 生活 | 健康、饮食、运动、学习、旅行、生活计划等 |
| work | 工作 | 前端开发、AI 工作流、项目经验、工具配置等 |

---

## 5.2 status

表示知识整理状态。

| 值 | 展示名 | 说明 |
|---|---|---|
| inbox | 收集箱 | 刚记录，尚未整理 |
| organized | 已整理 | 已整理为正式知识条目 |
| archived | 归档 | 不常用但需要保留 |

---

## 5.3 type

表示知识内容类型。

| 值 | 展示名 | 说明 |
|---|---|---|
| note | 笔记 | 普通知识笔记 |
| link | 链接 | 网页、文档、工具链接 |
| prompt | Prompt | AI 使用提示词 |
| project | 项目记录 | 项目方案、复盘、开发记录 |
| log | 日志 | 日常记录、阶段性记录 |
| excerpt | 摘录 | 文章、书籍、对话摘录 |
| plan | 计划 | 生活计划、学习计划、工作计划 |
| snippet | 代码片段 | 命令、代码、配置片段 |

---

## 6. profiles 表

## 6.1 用途

`profiles` 表用于保存用户基础信息。

Supabase Auth 的用户信息存储在 `auth.users` 中，业务系统不直接依赖 `auth.users` 展示用户资料，而是通过 `profiles` 表扩展。

---

## 6.2 字段设计

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| id | uuid | 是 | 无 | 主键，对应 auth.users.id |
| email | text | 是 | 无 | 用户邮箱 |
| display_name | text | 否 | null | 用户展示名，V0.1 可不用 |
| created_at | timestamptz | 是 | now() | 创建时间 |
| updated_at | timestamptz | 是 | now() | 更新时间 |

---

## 6.3 SQL

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 7. knowledge_items 表

## 7.1 用途

`knowledge_items` 是 KnowNest 的核心表，用于保存每一条知识内容。

---

## 7.2 字段设计

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| id | uuid | 是 | gen_random_uuid() | 主键 |
| user_id | uuid | 是 | auth.uid() | 所属用户 |
| title | text | 是 | '未命名内容' | 标题 |
| content | text | 是 | '' | Markdown 正文 |
| space | text | 是 | 'work' | life / work |
| type | text | 是 | 'note' | 内容类型 |
| status | text | 是 | 'inbox' | 整理状态 |
| source_url | text | 否 | null | 来源链接 |
| is_favorite | boolean | 是 | false | 是否收藏 |
| created_at | timestamptz | 是 | now() | 创建时间 |
| updated_at | timestamptz | 是 | now() | 更新时间 |

---

## 7.3 约束说明

### 标题与正文

V0.1 允许标题为空字符串的情况不推荐，但数据库层默认给出标题。

前端需要保证：

```text
title 和 content 不能同时为空
```

数据库层不强制该规则，避免复杂约束影响快速记录。

---

### source_url

V0.1 不在数据库层强校验 URL 格式。

原因：

- 用户可能保存非标准链接
- 也可能保存本地路径或备注型来源
- 前端可以做轻量校验

---

## 7.4 SQL

```sql
create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '未命名内容',
  content text not null default '',
  space text not null default 'work',
  type text not null default 'note',
  status text not null default 'inbox',
  source_url text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint knowledge_items_space_check
    check (space in ('life', 'work')),

  constraint knowledge_items_type_check
    check (type in ('note', 'link', 'prompt', 'project', 'log', 'excerpt', 'plan', 'snippet')),

  constraint knowledge_items_status_check
    check (status in ('inbox', 'organized', 'archived'))
);
```

---

## 7.5 补充唯一约束

为了让 `knowledge_item_tags` 可以通过复合外键校验 user_id，需要增加以下唯一约束：

```sql
alter table public.knowledge_items
  add constraint knowledge_items_id_user_id_unique unique (id, user_id);
```

---

## 8. tags 表

## 8.1 用途

`tags` 表保存用户创建的标签。

标签属于用户，不同用户之间可以有同名标签。

---

## 8.2 字段设计

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| id | uuid | 是 | gen_random_uuid() | 主键 |
| user_id | uuid | 是 | auth.uid() | 所属用户 |
| name | text | 是 | 无 | 标签名 |
| created_at | timestamptz | 是 | now() | 创建时间 |
| updated_at | timestamptz | 是 | now() | 更新时间 |

---

## 8.3 约束说明

同一用户下标签名称不能重复。

```text
unique(user_id, name)
```

标签名需要做 trim 处理。

V0.1 可以由前端在创建标签时处理：

```text
去除前后空格
禁止空标签名
```

数据库层增加基础约束，防止空字符串。

---

## 8.4 SQL

```sql
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tags_name_not_empty check (length(trim(name)) > 0),
  constraint tags_user_id_name_unique unique (user_id, name),
  constraint tags_id_user_id_unique unique (id, user_id)
);
```

---

## 9. knowledge_item_tags 表

## 9.1 用途

`knowledge_item_tags` 表用于保存知识条目与标签的多对多关系。

一条知识可以有多个标签，一个标签也可以绑定到多个知识条目。

---

## 9.2 字段设计

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| user_id | uuid | 是 | auth.uid() | 所属用户 |
| item_id | uuid | 是 | 无 | 知识条目 ID |
| tag_id | uuid | 是 | 无 | 标签 ID |
| created_at | timestamptz | 是 | now() | 创建时间 |

---

## 9.3 为什么关系表也保留 user_id

理论上通过 `item_id` 和 `tag_id` 可以反查用户，但 V0.1 建议在关系表中保留 `user_id`。

原因：

1. RLS 策略更简单。
2. 查询当前用户标签关系更方便。
3. 更容易建立复合外键，防止跨用户绑定。
4. 后续统计标签使用次数更方便。

---

## 9.4 SQL

```sql
create table if not exists public.knowledge_item_tags (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz not null default now(),

  primary key (item_id, tag_id),

  constraint knowledge_item_tags_item_user_fk
    foreign key (item_id, user_id)
    references public.knowledge_items(id, user_id)
    on delete cascade,

  constraint knowledge_item_tags_tag_user_fk
    foreign key (tag_id, user_id)
    references public.tags(id, user_id)
    on delete cascade
);
```

---

## 10. 更新时间触发器

## 10.1 用途

当记录更新时，自动刷新 `updated_at` 字段。

适用表：

```text
profiles
knowledge_items
tags
```

关系表 `knowledge_item_tags` 暂不需要 `updated_at`。

---

## 10.2 SQL

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

---

## 10.3 Trigger

```sql
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_knowledge_items_updated_at
before update on public.knowledge_items
for each row
execute function public.set_updated_at();

create trigger set_tags_updated_at
before update on public.tags
for each row
execute function public.set_updated_at();
```

---

## 11. 新用户 Profile 自动创建

## 11.1 用途

当 Supabase Auth 中创建新用户时，自动在 `profiles` 表中创建对应记录。

---

## 11.2 SQL

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## 12. 索引设计

## 12.1 基础索引目标

V0.1 主要查询场景：

```text
按用户查询知识条目
按更新时间排序
按状态筛选
按空间筛选
按类型筛选
按收藏筛选
按标签筛选
按标题 / 正文搜索
```

---

## 12.2 knowledge_items 索引

```sql
create index if not exists knowledge_items_user_updated_idx
on public.knowledge_items (user_id, updated_at desc);

create index if not exists knowledge_items_user_status_updated_idx
on public.knowledge_items (user_id, status, updated_at desc);

create index if not exists knowledge_items_user_space_updated_idx
on public.knowledge_items (user_id, space, updated_at desc);

create index if not exists knowledge_items_user_type_updated_idx
on public.knowledge_items (user_id, type, updated_at desc);

create index if not exists knowledge_items_user_favorite_updated_idx
on public.knowledge_items (user_id, is_favorite, updated_at desc);
```

---

## 12.3 tags 索引

```sql
create index if not exists tags_user_name_idx
on public.tags (user_id, name);
```

---

## 12.4 knowledge_item_tags 索引

```sql
create index if not exists knowledge_item_tags_user_item_idx
on public.knowledge_item_tags (user_id, item_id);

create index if not exists knowledge_item_tags_user_tag_idx
on public.knowledge_item_tags (user_id, tag_id);
```

---

## 12.5 文本搜索索引，V0.1 可选

V0.1 可以先使用简单 `ilike` 搜索。

如果数据量较小，暂时不加全文索引也可以。

如果希望搜索更流畅，可以启用 `pg_trgm` 扩展并添加 trigram 索引。

```sql
create extension if not exists pg_trgm;

create index if not exists knowledge_items_title_trgm_idx
on public.knowledge_items using gin (title gin_trgm_ops);

create index if not exists knowledge_items_content_trgm_idx
on public.knowledge_items using gin (content gin_trgm_ops);
```

### 注意

中文、日文等内容的搜索体验可能仍然不如专业搜索引擎。

V0.1 只要求基础可用，不追求高级全文检索。

---

## 13. RLS 权限设计

## 13.1 总体原则

所有业务表启用 Row Level Security。

用户只能访问 `user_id = auth.uid()` 的数据。

需要启用 RLS 的表：

```text
profiles
knowledge_items
tags
knowledge_item_tags
```

---

## 13.2 启用 RLS

```sql
alter table public.profiles enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.tags enable row level security;
alter table public.knowledge_item_tags enable row level security;
```

---

## 13.3 profiles RLS

### 查询自己的 profile

```sql
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);
```

### 更新自己的 profile

```sql
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

### 插入自己的 profile

一般由 trigger 自动创建。

但为了兼容异常情况，可以允许用户插入自己的 profile。

```sql
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);
```

---

## 13.4 knowledge_items RLS

### 查询自己的知识条目

```sql
create policy "knowledge_items_select_own"
on public.knowledge_items
for select
to authenticated
using (auth.uid() = user_id);
```

### 创建自己的知识条目

```sql
create policy "knowledge_items_insert_own"
on public.knowledge_items
for insert
to authenticated
with check (auth.uid() = user_id);
```

### 更新自己的知识条目

```sql
create policy "knowledge_items_update_own"
on public.knowledge_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### 删除自己的知识条目

```sql
create policy "knowledge_items_delete_own"
on public.knowledge_items
for delete
to authenticated
using (auth.uid() = user_id);
```

---

## 13.5 tags RLS

### 查询自己的标签

```sql
create policy "tags_select_own"
on public.tags
for select
to authenticated
using (auth.uid() = user_id);
```

### 创建自己的标签

```sql
create policy "tags_insert_own"
on public.tags
for insert
to authenticated
with check (auth.uid() = user_id);
```

### 更新自己的标签

```sql
create policy "tags_update_own"
on public.tags
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### 删除自己的标签

```sql
create policy "tags_delete_own"
on public.tags
for delete
to authenticated
using (auth.uid() = user_id);
```

---

## 13.6 knowledge_item_tags RLS

### 查询自己的标签绑定关系

```sql
create policy "knowledge_item_tags_select_own"
on public.knowledge_item_tags
for select
to authenticated
using (auth.uid() = user_id);
```

### 创建自己的标签绑定关系

```sql
create policy "knowledge_item_tags_insert_own"
on public.knowledge_item_tags
for insert
to authenticated
with check (auth.uid() = user_id);
```

### 删除自己的标签绑定关系

```sql
create policy "knowledge_item_tags_delete_own"
on public.knowledge_item_tags
for delete
to authenticated
using (auth.uid() = user_id);
```

### 更新说明

关系表通常不需要 update。

如果要修改绑定关系，建议：

```text
删除旧关系
插入新关系
```

---

## 14. 完整初始化 SQL 草案

以下 SQL 可以作为 V0.1 初始化迁移草案。

实际执行前建议根据 Supabase 项目情况再检查一遍。

```sql
-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- knowledge_items
create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '未命名内容',
  content text not null default '',
  space text not null default 'work',
  type text not null default 'note',
  status text not null default 'inbox',
  source_url text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint knowledge_items_space_check
    check (space in ('life', 'work')),

  constraint knowledge_items_type_check
    check (type in ('note', 'link', 'prompt', 'project', 'log', 'excerpt', 'plan', 'snippet')),

  constraint knowledge_items_status_check
    check (status in ('inbox', 'organized', 'archived')),

  constraint knowledge_items_id_user_id_unique unique (id, user_id)
);

-- tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tags_name_not_empty check (length(trim(name)) > 0),
  constraint tags_user_id_name_unique unique (user_id, name),
  constraint tags_id_user_id_unique unique (id, user_id)
);

-- knowledge_item_tags
create table if not exists public.knowledge_item_tags (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz not null default now(),

  primary key (item_id, tag_id),

  constraint knowledge_item_tags_item_user_fk
    foreign key (item_id, user_id)
    references public.knowledge_items(id, user_id)
    on delete cascade,

  constraint knowledge_item_tags_tag_user_fk
    foreign key (tag_id, user_id)
    references public.tags(id, user_id)
    on delete cascade
);

-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- updated_at triggers
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_knowledge_items_updated_at on public.knowledge_items;
create trigger set_knowledge_items_updated_at
before update on public.knowledge_items
for each row
execute function public.set_updated_at();

drop trigger if exists set_tags_updated_at on public.tags;
create trigger set_tags_updated_at
before update on public.tags
for each row
execute function public.set_updated_at();

-- handle new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- indexes
create index if not exists knowledge_items_user_updated_idx
on public.knowledge_items (user_id, updated_at desc);

create index if not exists knowledge_items_user_status_updated_idx
on public.knowledge_items (user_id, status, updated_at desc);

create index if not exists knowledge_items_user_space_updated_idx
on public.knowledge_items (user_id, space, updated_at desc);

create index if not exists knowledge_items_user_type_updated_idx
on public.knowledge_items (user_id, type, updated_at desc);

create index if not exists knowledge_items_user_favorite_updated_idx
on public.knowledge_items (user_id, is_favorite, updated_at desc);

create index if not exists tags_user_name_idx
on public.tags (user_id, name);

create index if not exists knowledge_item_tags_user_item_idx
on public.knowledge_item_tags (user_id, item_id);

create index if not exists knowledge_item_tags_user_tag_idx
on public.knowledge_item_tags (user_id, tag_id);

create index if not exists knowledge_items_title_trgm_idx
on public.knowledge_items using gin (title gin_trgm_ops);

create index if not exists knowledge_items_content_trgm_idx
on public.knowledge_items using gin (content gin_trgm_ops);

-- enable RLS
alter table public.profiles enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.tags enable row level security;
alter table public.knowledge_item_tags enable row level security;

-- profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- knowledge_items policies
drop policy if exists "knowledge_items_select_own" on public.knowledge_items;
create policy "knowledge_items_select_own"
on public.knowledge_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "knowledge_items_insert_own" on public.knowledge_items;
create policy "knowledge_items_insert_own"
on public.knowledge_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "knowledge_items_update_own" on public.knowledge_items;
create policy "knowledge_items_update_own"
on public.knowledge_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "knowledge_items_delete_own" on public.knowledge_items;
create policy "knowledge_items_delete_own"
on public.knowledge_items
for delete
to authenticated
using (auth.uid() = user_id);

-- tags policies
drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own"
on public.tags
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own"
on public.tags
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own"
on public.tags
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own"
on public.tags
for delete
to authenticated
using (auth.uid() = user_id);

-- knowledge_item_tags policies
drop policy if exists "knowledge_item_tags_select_own" on public.knowledge_item_tags;
create policy "knowledge_item_tags_select_own"
on public.knowledge_item_tags
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "knowledge_item_tags_insert_own" on public.knowledge_item_tags;
create policy "knowledge_item_tags_insert_own"
on public.knowledge_item_tags
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "knowledge_item_tags_delete_own" on public.knowledge_item_tags;
create policy "knowledge_item_tags_delete_own"
on public.knowledge_item_tags
for delete
to authenticated
using (auth.uid() = user_id);
```

---

## 15. 常用查询设计

以下查询用于指导前端和 API 实现。

---

## 15.1 查询知识列表

默认查询：

```text
当前用户
非归档内容
按 updated_at 倒序
```

SQL 示例：

```sql
select *
from public.knowledge_items
where user_id = auth.uid()
  and status <> 'archived'
order by updated_at desc;
```

在 Supabase Client 中通常不需要显式传 `auth.uid()`，RLS 会自动限制。

---

## 15.2 查询收集箱

```sql
select *
from public.knowledge_items
where status = 'inbox'
order by updated_at desc;
```

---

## 15.3 查询收藏

```sql
select *
from public.knowledge_items
where is_favorite = true
  and status <> 'archived'
order by updated_at desc;
```

---

## 15.4 查询归档

```sql
select *
from public.knowledge_items
where status = 'archived'
order by updated_at desc;
```

---

## 15.5 关键词搜索

V0.1 简单搜索：

```sql
select *
from public.knowledge_items
where status <> 'archived'
  and (
    title ilike '%' || :keyword || '%'
    or content ilike '%' || :keyword || '%'
  )
order by updated_at desc;
```

---

## 15.6 按标签筛选知识条目

```sql
select ki.*
from public.knowledge_items ki
join public.knowledge_item_tags kit on kit.item_id = ki.id
join public.tags t on t.id = kit.tag_id
where t.name = :tag_name
order by ki.updated_at desc;
```

---

## 15.7 查询知识条目及标签

```sql
select
  ki.*,
  coalesce(
    json_agg(
      json_build_object(
        'id', t.id,
        'name', t.name
      )
    ) filter (where t.id is not null),
    '[]'
  ) as tags
from public.knowledge_items ki
left join public.knowledge_item_tags kit on kit.item_id = ki.id
left join public.tags t on t.id = kit.tag_id
where ki.id = :item_id
group by ki.id;
```

---

## 16. 前端类型建议

V0.1 前端可以先定义以下类型。

```ts
export type KnowledgeSpace = 'life' | 'work'

export type KnowledgeStatus = 'inbox' | 'organized' | 'archived'

export type KnowledgeType =
  | 'note'
  | 'link'
  | 'prompt'
  | 'project'
  | 'log'
  | 'excerpt'
  | 'plan'
  | 'snippet'

export type KnowledgeItem = {
  id: string
  user_id: string
  title: string
  content: string
  space: KnowledgeSpace
  type: KnowledgeType
  status: KnowledgeStatus
  source_url: string | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export type Tag = {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export type KnowledgeItemWithTags = KnowledgeItem & {
  tags: Tag[]
}
```

---

## 17. 前端常量建议

```ts
export const KNOWLEDGE_SPACES = [
  { value: 'life', label: '生活' },
  { value: 'work', label: '工作' },
] as const

export const KNOWLEDGE_STATUSES = [
  { value: 'inbox', label: '收集箱' },
  { value: 'organized', label: '已整理' },
  { value: 'archived', label: '归档' },
] as const

export const KNOWLEDGE_TYPES = [
  { value: 'note', label: '笔记' },
  { value: 'link', label: '链接' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'project', label: '项目记录' },
  { value: 'log', label: '日志' },
  { value: 'excerpt', label: '摘录' },
  { value: 'plan', label: '计划' },
  { value: 'snippet', label: '代码片段' },
] as const
```

---

## 18. 数据操作约定

## 18.1 创建知识条目

前端创建知识条目时应传入：

```ts
{
  user_id: currentUser.id,
  title: title || '未命名内容',
  content: content || '',
  space: selectedSpace || 'work',
  type: selectedType || 'note',
  status: 'inbox',
  source_url: sourceUrl || null,
  is_favorite: false,
}
```

---

## 18.2 创建标签

前端创建标签时应：

1. trim 标签名。
2. 判断是否为空。
3. 尝试插入。
4. 如果已存在，则复用已有标签。

---

## 18.3 更新标签绑定

推荐策略：

```text
保存知识条目时：
1. 保存 knowledge_items 主表
2. 查询或创建 tags
3. 删除该 item 当前所有 tag 关系
4. 重新插入新的 tag 关系
```

V0.1 这样实现最简单。

后续可以优化为 diff 更新。

---

## 18.4 删除知识条目

删除 `knowledge_items` 后，相关 `knowledge_item_tags` 会通过 `on delete cascade` 自动删除。

标签本身不会被删除。

后续可以增加“清理未使用标签”的功能。

---

## 19. V0.1 不包含的数据能力

以下能力不在 V0.1 数据库范围内。

```text
软删除
回收站
版本历史
附件存储
图片存储
全文网页内容
PDF 内容
向量数据
AI 总结数据
AI 对话数据
公开分享权限
团队空间权限
自定义空间
自定义类型
```

---

## 20. 后续扩展方向

## 20.1 AI 总结表

后续可新增：

```sql
create table public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  summary text not null,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 20.2 向量表

后续可新增：

```sql
create table public.knowledge_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector,
  created_at timestamptz not null default now()
);
```

注意：该表需要后续启用 pgvector，并根据具体模型维度设置 vector 维度。

---

## 20.3 收藏集合 / Collection

后续如果需要主题集合，可以新增：

```text
collections
collection_items
```

用于把多条知识组织成专题。

---

## 21. 验收标准

数据库设计完成后，应满足以下标准。

### 21.1 表结构

- 已创建 profiles 表。
- 已创建 knowledge_items 表。
- 已创建 tags 表。
- 已创建 knowledge_item_tags 表。
- 字段类型符合设计。
- 默认值符合设计。
- check constraints 生效。
- 外键关系正确。

### 21.2 权限

- 所有业务表启用 RLS。
- 用户只能读取自己的数据。
- 用户只能创建自己的数据。
- 用户只能修改自己的数据。
- 用户只能删除自己的数据。
- 无法跨用户绑定知识条目和标签。

### 21.3 基础操作

- 可以创建知识条目。
- 可以更新知识条目。
- 可以删除知识条目。
- 可以创建标签。
- 可以给知识条目绑定标签。
- 可以移除知识条目标签。
- 删除知识条目后，标签绑定关系自动删除。

### 21.4 查询

- 可以查询知识列表。
- 可以查询收集箱。
- 可以查询收藏。
- 可以查询归档。
- 可以按空间筛选。
- 可以按状态筛选。
- 可以按类型筛选。
- 可以按标签筛选。
- 可以按关键词搜索标题和正文。

---

## 22. 当前结论

V0.1 数据库设计采用简单清晰的四表结构：

```text
profiles
knowledge_items
tags
knowledge_item_tags
```

该结构可以稳定支撑第一版核心功能：

```text
登录后的个人数据隔离
知识条目 CRUD
标签管理
搜索筛选
收藏归档
多设备同步
```

同时，它也为后续 AI 总结、向量检索、知识库问答、附件和集合功能预留了扩展空间。

V0.1 的数据库重点不是复杂，而是：

```text
安全、稳定、清晰、可扩展。
```

