-- Daily tasks keep their order from day to day.
-- Every task copied into a new day got the same created_at (the copy runs as one insert), and
-- the list is sorted by time, then created_at. Tasks with the same time, or no time, then came
-- back in whatever order the database stored them, and a task ticked and unticked a few times
-- is stored again further on, so it could move to the bottom of the next day's list.
-- Now the copies get created_at values in the previous day's order. For a day whose tasks
-- already tie, the order they are stored in decides, which is usually the order shown.

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

  -- Tasks already on today's list (added before the day was set up) are not copied twice.
  -- Each copy gets its own created_at, a microsecond apart in the source day's order, so tasks
  -- with the same time (or none) keep their order.
  insert into public.daily_tasks (user_id, title, description, deadline, is_completed, task_date, created_at)
  select p_user_id, s.title, s.description, s.deadline, false, v_today,
    now() + (row_number() over (order by s.created_at, s.ctid)) * interval '1 microsecond'
  from public.daily_tasks s
  where s.user_id = p_user_id and s.task_date = v_source
    and not exists (
      select 1 from public.daily_tasks t
      where t.user_id = p_user_id and t.task_date = v_today and t.title = s.title
    );
end;
$$;

revoke execute on function public.ensure_daily_tasks_for_today(uuid, date) from public, anon;
grant execute on function public.ensure_daily_tasks_for_today(uuid, date) to authenticated;
