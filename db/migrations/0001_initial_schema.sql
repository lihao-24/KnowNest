-- KnowNest V0.1 initial database schema.
--
-- Boundary:
-- 1. Sections "Common PostgreSQL" are business schema and can run on standard
--    PostgreSQL.
-- 2. Section "Supabase-only" depends on Supabase Auth/RLS objects:
--    auth.users, auth.uid(), and the authenticated role.
-- 3. For future self-hosted PostgreSQL, keep the common schema and replace the
--    Supabase-only section with the production auth and authorization model.

begin;

-- ---------------------------------------------------------------------------
-- Common PostgreSQL: extensions
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Common PostgreSQL: business tables
-- ---------------------------------------------------------------------------
-- user_id columns intentionally do not default to auth.uid(). The V0.1 data
-- access boundary uses Drizzle/pg with DATABASE_URL and must write user_id
-- explicitly from the authenticated server-side user context.

create table if not exists public.profiles (
  id uuid primary key,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tags_name_not_empty check (length(trim(name)) > 0),
  constraint tags_user_id_name_unique unique (user_id, name),
  constraint tags_id_user_id_unique unique (id, user_id)
);

create table if not exists public.knowledge_item_tags (
  user_id uuid not null references public.profiles(id) on delete cascade,
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

-- ---------------------------------------------------------------------------
-- Common PostgreSQL: updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

-- ---------------------------------------------------------------------------
-- Common PostgreSQL: indexes
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Supabase-only: Auth boundary
-- ---------------------------------------------------------------------------
-- Depends on auth.users. This keeps the portable business tables referencing
-- public.profiles, while development Supabase Auth owns profile lifecycle.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_auth_users_fk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_id_auth_users_fk
      foreign key (id)
      references auth.users(id)
      on delete cascade;
  end if;
end;
$$;

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

-- ---------------------------------------------------------------------------
-- Supabase-only: RLS using auth.uid() and authenticated
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.tags enable row level security;
alter table public.knowledge_item_tags enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists knowledge_items_select_own on public.knowledge_items;
create policy knowledge_items_select_own
on public.knowledge_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists knowledge_items_insert_own on public.knowledge_items;
create policy knowledge_items_insert_own
on public.knowledge_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists knowledge_items_update_own on public.knowledge_items;
create policy knowledge_items_update_own
on public.knowledge_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists knowledge_items_delete_own on public.knowledge_items;
create policy knowledge_items_delete_own
on public.knowledge_items
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists tags_select_own on public.tags;
create policy tags_select_own
on public.tags
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists tags_insert_own on public.tags;
create policy tags_insert_own
on public.tags
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists tags_update_own on public.tags;
create policy tags_update_own
on public.tags
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists tags_delete_own on public.tags;
create policy tags_delete_own
on public.tags
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists knowledge_item_tags_select_own on public.knowledge_item_tags;
create policy knowledge_item_tags_select_own
on public.knowledge_item_tags
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists knowledge_item_tags_insert_own on public.knowledge_item_tags;
create policy knowledge_item_tags_insert_own
on public.knowledge_item_tags
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists knowledge_item_tags_delete_own on public.knowledge_item_tags;
create policy knowledge_item_tags_delete_own
on public.knowledge_item_tags
for delete
to authenticated
using (auth.uid() = user_id);

commit;
