create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  status text not null default '资料未全',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  user_id text not null,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saved_choices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  session_id uuid references chat_sessions(id) on delete set null,
  school_name text not null,
  major_name text,
  batch text not null,
  plan_type text not null,
  bucket text not null,
  rationale text,
  risk_tags text[] not null default '{}',
  sources jsonb not null default '[]'::jsonb,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists score_segments (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  province text not null,
  subject_type text not null,
  score integer not null,
  same_score_count integer not null,
  cumulative_count integer not null,
  source_name text not null,
  source_url text,
  source_published_at date,
  trust_level text not null default 'T1',
  imported_at timestamptz not null default now(),
  notes text,
  unique (year, province, subject_type, score)
);

create table if not exists admission_records (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  province text not null,
  batch text not null,
  plan_type text not null,
  subject_type text not null,
  school_code text,
  school_name text not null,
  major_group_code text,
  major_group_name text,
  major_code text,
  major_name text,
  min_score integer,
  min_rank integer,
  avg_score integer,
  avg_rank integer,
  plan_count integer,
  source_name text not null,
  source_url text,
  source_published_at date,
  trust_level text not null default 'T1',
  imported_at timestamptz not null default now(),
  notes text
);

create table if not exists enrollment_plans (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  province text not null,
  batch text not null,
  plan_type text not null,
  subject_type text not null,
  school_code text,
  school_name text not null,
  major_group_code text,
  major_group_name text,
  major_code text,
  major_name text,
  plan_count integer not null,
  tuition text,
  duration text,
  campus text,
  requirements text,
  source_name text not null,
  source_url text,
  source_published_at date,
  trust_level text not null default 'T2',
  imported_at timestamptz not null default now(),
  notes text
);

create table if not exists school_documents (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  school_code text,
  school_name text not null,
  doc_type text not null,
  title text not null,
  source_name text not null,
  source_url text,
  published_at date,
  trust_level text not null default 'T2',
  content text not null,
  imported_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references school_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_id_idx on chat_sessions(user_id);
create index if not exists chat_messages_session_user_idx on chat_messages(session_id, user_id);
create index if not exists admission_records_lookup_idx on admission_records(province, batch, plan_type, subject_type, min_rank);
create index if not exists enrollment_plans_lookup_idx on enrollment_plans(province, batch, plan_type, subject_type, school_code, major_code);
