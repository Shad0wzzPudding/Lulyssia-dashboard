-- Repeating tasks: move to the next round on the server, not only when the dashboard is opened.
-- Before, a ticked repeating task stayed "done" until the app was opened after its deadline, so
-- the LINE morning letter and starting-soon reminders skipped its next round.
-- Same rule as renewRecurringTask in src/hooks/useDashboardData.ts: rounds are counted from the
-- first deadline (recurrence_anchor), a day the month doesn't have becomes its last day
-- (Postgres month arithmetic does this), and the start keeps its distance before the deadline.
-- Only for LINE users with the morning letter or reminders on: for everyone else the dashboard
-- still does it when opened, and nothing else needs it sooner.
create or replace function public.renew_recurring_tasks()
returns integer
language plpgsql
security definer
set search_path = public
-- Month and day steps follow the Thai calendar (31 Jan 10:00 -> 28 Feb 10:00 Thai time)
set timezone = 'Asia/Bangkok'
as $$
declare
  t record;
  v_step interval;
  v_anchor timestamptz;
  v_k integer;
  v_next timestamptz;
  v_renewed integer := 0;
begin
  for t in
    select tk.id, tk.deadline, tk.recurrence_unit, tk.recurrence_anchor,
           greatest(coalesce(tk.recurrence_interval, 1), 1) as n
    from public.tasks tk
    join public.line_links l on l.user_id = tk.user_id
    where tk.recurrence_unit is not null
      and tk.deadline is not null
      and tk.deadline <= now()
      and l.line_user_id is not null
      and (l.is_enabled or l.reminders_enabled)
  loop
    v_step := case
      when t.recurrence_unit in ('day', 'days') then make_interval(days => t.n)
      when t.recurrence_unit in ('week', 'weeks') then make_interval(days => 7 * t.n)
      when t.recurrence_unit in ('month', 'months') then make_interval(months => t.n)
      when t.recurrence_unit in ('year', 'years') then make_interval(years => t.n)
    end;
    continue when v_step is null;

    v_anchor := coalesce(t.recurrence_anchor, t.deadline);
    -- Rough number of rounds since the anchor, then step to the first one after now
    v_k := greatest(1, floor(
      extract(epoch from now() - v_anchor) / extract(epoch from (v_anchor + v_step) - v_anchor)
    )::integer);
    while v_k > 1 and v_anchor + v_step * (v_k - 1) > now() loop
      v_k := v_k - 1;
    end loop;
    while v_anchor + v_step * v_k <= now() loop
      v_k := v_k + 1;
    end loop;
    v_next := v_anchor + v_step * v_k;

    update public.tasks
    set deadline = v_next,
        start_date = case when start_date is null then null else v_next - (deadline - start_date) end,
        recurrence_anchor = v_anchor,
        is_completed = false
    -- Skip it if the dashboard renewed it in the meantime
    where id = t.id and deadline = t.deadline;
    if found then
      v_renewed := v_renewed + 1;
    end if;
  end loop;
  return v_renewed;
end;
$$;

revoke execute on function public.renew_recurring_tasks() from public, anon, authenticated;

-- Every 5 minutes, like the missed-deadline check
do $$
declare
  r record;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron is not installed: skipping the repeating-task job';
    return;
  end if;

  for r in select jobid from cron.job where jobname = 'renew-recurring-tasks' loop
    perform cron.unschedule(r.jobid);
  end loop;

  perform cron.schedule('renew-recurring-tasks', '*/5 * * * *', 'select public.renew_recurring_tasks()');
end;
$$;
