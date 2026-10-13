-- Daily tasks: setting up a new day copies the routine even when the day already has a task.
-- Before, the copy was skipped if today had any task. A daily task added while the first load of
-- the day was failing (the screen still showing yesterday's list) was saved for today, so the
-- routine was never copied, and every later day copied from that one-task day.
-- Now the previous day's tasks are copied unless today already has one with the same title.
-- The app also calls this before adding a daily task, so the routine is in place first.

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

  -- Tasks already on today's list (added before the day was set up) are not copied twice
  insert into public.daily_tasks (user_id, title, description, deadline, is_completed, task_date)
  select p_user_id, s.title, s.description, s.deadline, false, v_today
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
