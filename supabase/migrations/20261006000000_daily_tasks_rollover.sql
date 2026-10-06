-- Daily tasks: roll the previous list over to today exactly once per day.
-- A small table remembers which days were already set up, so deleting a task
-- (or the whole list) never makes it reappear on the next refresh.
create table if not exists public.daily_task_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  task_date date not null,
  primary key (user_id, task_date)
);

alter table public.daily_task_days enable row level security;
-- No policies on purpose: only ensure_daily_tasks_for_today (SECURITY DEFINER) touches this table.
revoke all on table public.daily_task_days from anon, authenticated;

create index if not exists daily_tasks_user_date_idx on public.daily_tasks (user_id, task_date);

-- The old version took only the user id and used the server's (UTC) date.
-- The new one takes the user's local date so the day changes at local midnight.
drop function if exists public.ensure_daily_tasks_for_today(uuid);

create or replace function public.ensure_daily_tasks_for_today(p_user_id uuid, p_today date default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := coalesce(p_today, current_date);
  v_source date;
begin
  if p_user_id is null or p_user_id is distinct from auth.uid() then
    raise exception 'Unauthorized: Cannot access other users'' data';
  end if;

  -- Local dates are never more than one day away from the server's UTC date
  if v_today not between current_date - 1 and current_date + 1 then
    raise exception 'Invalid date';
  end if;

  -- Only the first call for a given day copies anything
  insert into public.daily_task_days (user_id, task_date)
  values (p_user_id, v_today)
  on conflict do nothing;
  if not found then
    return;
  end if;

  -- Today already has tasks (for example, created before days were tracked)
  if exists (
    select 1 from public.daily_tasks where user_id = p_user_id and task_date = v_today
  ) then
    return;
  end if;

  -- Copy from the most recent earlier day that was set up; fall back to older untracked data
  select coalesce(
    (select max(task_date) from public.daily_task_days
      where user_id = p_user_id and task_date < v_today),
    (select max(task_date) from public.daily_tasks
      where user_id = p_user_id and task_date < v_today)
  ) into v_source;

  if v_source is null then
    return;
  end if;

  insert into public.daily_tasks (user_id, title, description, deadline, is_completed, task_date)
  select p_user_id, title, description, deadline, false, v_today
  from public.daily_tasks
  where user_id = p_user_id and task_date = v_source;
end;
$$;

revoke execute on function public.ensure_daily_tasks_for_today(uuid, date) from public, anon;
grant execute on function public.ensure_daily_tasks_for_today(uuid, date) to authenticated;
