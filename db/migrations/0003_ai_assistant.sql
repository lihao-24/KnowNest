-- KnowNest V0.3 AI assistant schema foundation.
--
-- Adds AI-generated summary metadata to knowledge items and user-scoped AI
-- usage logs for auditing and daily usage limits. This migration is created
-- for manual execution only; do not run it automatically from agents.

begin;

-- ---------------------------------------------------------------------------
-- Common PostgreSQL: knowledge item AI metadata
-- ---------------------------------------------------------------------------

alter table public.knowledge_items
  add column if not exists summary text,
  add column if not exists summary_generated_at timestamptz,
  add column if not exists ai_updated_at timestamptz;

-- ---------------------------------------------------------------------------
-- Common PostgreSQL: AI usage logs
-- ---------------------------------------------------------------------------

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  knowledge_item_id uuid,
  action_type text not null,
  model text not null,
  status text not null,
  input_length integer not null default 0,
  output_length integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),

  constraint ai_usage_logs_status_check
    check (status in ('success', 'failed')),

  constraint ai_usage_logs_action_type_check
    check (action_type in (
      'generate_summary',
      'suggest_tags',
      'suggest_category',
      'improve_title',
      'organize_content'
    ))
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_usage_logs_item_user_fk'
      and conrelid = 'public.ai_usage_logs'::regclass
  ) then
    alter table public.ai_usage_logs
      add constraint ai_usage_logs_item_user_fk
      foreign key (knowledge_item_id, user_id)
      references public.knowledge_items(id, user_id)
      on delete set null (knowledge_item_id);
  end if;
end;
$$;

create index if not exists ai_usage_logs_user_created_idx
on public.ai_usage_logs (user_id, created_at desc);

create index if not exists ai_usage_logs_user_action_created_idx
on public.ai_usage_logs (user_id, action_type, created_at desc);

-- ---------------------------------------------------------------------------
-- Supabase-only: RLS using auth.uid() and authenticated
-- ---------------------------------------------------------------------------

alter table public.ai_usage_logs enable row level security;

drop policy if exists ai_usage_logs_select_own on public.ai_usage_logs;
create policy ai_usage_logs_select_own
on public.ai_usage_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists ai_usage_logs_insert_own on public.ai_usage_logs;
create policy ai_usage_logs_insert_own
on public.ai_usage_logs
for insert
to authenticated
with check (auth.uid() = user_id);

commit;
