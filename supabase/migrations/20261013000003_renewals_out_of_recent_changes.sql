-- Repeating tasks moving to their next round no longer show up in Recent Changes.
-- Every renewal was logged as an "updated" entry, so with the every-5-minutes job a few daily
-- repeating tasks filled Recent Changes, and undoing one only bounced back 5 minutes later.
-- 1) log_activity skips changes made while app.skip_activity_log is on
-- 2) renew_recurring_tasks turns it on, and now also takes one person (the dashboard's renewal
--    goes through renew_my_recurring_tasks instead of updating the tasks itself), so the app and
--    the job share one rule

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Routine changes (repeating tasks moving to their next round) are not recorded
  IF current_setting('app.skip_activity_log', true) = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE'
     AND (to_jsonb(NEW) - 'sort_order' - 'updated_at') = (to_jsonb(OLD) - 'sort_order' - 'updated_at') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.activity_log (user_id, action_type, item_type, item_title, item_id, previous_data)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.title, OLD.title),
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb
      ELSE NULL
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.log_activity() FROM PUBLIC, anon, authenticated;

-- Replaced by the version below with an optional person (the cron job keeps calling it with none)
drop function if exists public.renew_recurring_tasks();

-- Same rule as before (see 20261013000000_renew_recurring_tasks.sql)
create function public.renew_recurring_tasks(p_user_id uuid default null)
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
  -- Routine, not something the person did: keep these changes out of Recent Changes
  -- (log_activity checks this; it lasts until the end of this transaction)
  perform set_config('app.skip_activity_log', 'on', true);

  for t in
    select tk.id, tk.deadline, tk.recurrence_unit, tk.recurrence_anchor,
           greatest(coalesce(tk.recurrence_interval, 1), 1) as n
    from public.tasks tk
    where tk.recurrence_unit is not null
      and tk.deadline is not null
      and tk.deadline <= now()
      and (
        -- One person's tasks (the dashboard, through renew_my_recurring_tasks)
        tk.user_id = p_user_id
        -- The scheduled job: everyone linked to LINE with the morning letter or reminders on
        or (p_user_id is null and exists (
          select 1 from public.line_links l
          where l.user_id = tk.user_id and l.line_user_id is not null and (l.is_enabled or l.reminders_enabled)
        ))
      )
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
    -- Skip it if it was renewed in the meantime (the job and the dashboard can run at once)
    where id = t.id and deadline = t.deadline;
    if found then
      v_renewed := v_renewed + 1;
    end if;
  end loop;
  return v_renewed;
end;
$$;

revoke execute on function public.renew_recurring_tasks(uuid) from public, anon, authenticated;

-- The dashboard: renew the signed-in person's own repeating tasks (whether or not they use LINE)
create or replace function public.renew_my_recurring_tasks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  return public.renew_recurring_tasks(auth.uid());
end;
$$;

revoke execute on function public.renew_my_recurring_tasks() from public, anon;
grant execute on function public.renew_my_recurring_tasks() to authenticated;
