-- Presets: ready-made setups for a task or an event (a name, a description format, tags and how
-- long after the start the Deadline / End falls). Kept with the account, like tags.

create table public.presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text not null default '',
  tag_ids uuid[] not null default '{}',
  due_amount integer,
  due_unit text,
  use_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The name: trimmed, 1 to 40 characters (names don't have to be unique)
  constraint presets_name_length check (name = btrim(name) and char_length(name) between 1 and 40),
  -- The due offset: 1 to 999 hours, days or weeks, or none at all (both empty)
  constraint presets_due_amount_range check (due_amount is null or due_amount between 1 and 999),
  constraint presets_due_unit_known check (due_unit is null or due_unit in ('hours', 'days', 'weeks')),
  constraint presets_due_both_or_none check ((due_amount is null) = (due_unit is null))
);

create index idx_presets_user_id on public.presets (user_id);

alter table public.presets enable row level security;

create policy "Users can manage their own presets"
on public.presets
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create trigger update_presets_updated_at
before update on public.presets
for each row
execute function public.update_updated_at_column();

-- Deleting a tag also takes it out of every preset that had it (the same trigger as for tasks,
-- events and interests; presets have no Recent Changes)
create or replace function public.remove_deleted_tag_from_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_skip text := current_setting('app.skip_activity_log', true);
begin
  perform set_config('app.skip_activity_log', 'on', true);
  update public.tasks set tag_ids = array_remove(tag_ids, old.id)
    where user_id = old.user_id and old.id = any(tag_ids);
  update public.events set tag_ids = array_remove(tag_ids, old.id)
    where user_id = old.user_id and old.id = any(tag_ids);
  update public.interests set tag_ids = array_remove(tag_ids, old.id)
    where user_id = old.user_id and old.id = any(tag_ids);
  update public.presets set tag_ids = array_remove(tag_ids, old.id)
    where user_id = old.user_id and old.id = any(tag_ids);
  perform set_config('app.skip_activity_log', coalesce(v_skip, ''), true);
  return old;
end;
$$;

revoke execute on function public.remove_deleted_tag_from_items() from public, anon, authenticated;
