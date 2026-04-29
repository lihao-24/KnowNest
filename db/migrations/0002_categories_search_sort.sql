-- KnowNest V0.2 knowledge organization enhancements.
--
-- Adds user-owned categories, links knowledge items to one category, and
-- extends Supabase RLS coverage for the new category data.

begin;

-- ---------------------------------------------------------------------------
-- Common PostgreSQL: categories
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_name_not_empty check (length(trim(name)) > 0),
  constraint categories_user_id_name_unique unique (user_id, name),
  constraint categories_id_user_id_unique unique (id, user_id)
);

alter table public.knowledge_items
  add column if not exists category_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'knowledge_items_category_user_fk'
      and conrelid = 'public.knowledge_items'::regclass
  ) then
    alter table public.knowledge_items
      add constraint knowledge_items_category_user_fk
      foreign key (category_id, user_id)
      references public.categories(id, user_id)
      on delete set null (category_id);
  end if;
end;
$$;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create index if not exists categories_user_name_idx
on public.categories (user_id, name);

create index if not exists knowledge_items_user_category_updated_idx
on public.knowledge_items (user_id, category_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Supabase-only: RLS using auth.uid() and authenticated
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;

drop policy if exists categories_select_own on public.categories;
create policy categories_select_own
on public.categories
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists categories_insert_own on public.categories;
create policy categories_insert_own
on public.categories
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists categories_update_own on public.categories;
create policy categories_update_own
on public.categories
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists categories_delete_own on public.categories;
create policy categories_delete_own
on public.categories
for delete
to authenticated
using (auth.uid() = user_id);

commit;
