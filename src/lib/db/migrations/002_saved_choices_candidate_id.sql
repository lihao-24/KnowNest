alter table saved_choices
  add column if not exists candidate_id text;

update saved_choices
set candidate_id = concat_ws(':', school_name, coalesce(major_name, ''), batch, plan_type, bucket)
where candidate_id is null;

alter table saved_choices
  alter column candidate_id set not null;

create unique index if not exists saved_choices_user_candidate_idx
  on saved_choices(user_id, candidate_id);
