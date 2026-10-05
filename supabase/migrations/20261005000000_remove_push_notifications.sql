-- Web push notifications were removed in favour of the LINE daily digest.

-- 1) Stop any cron job that still calls the removed send-daily-notifications function
do $$
declare
  j record;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    for j in
      select jobid from cron.job where command ilike '%send-daily-notifications%'
    loop
      perform cron.unschedule(j.jobid);
    end loop;
  end if;
end;
$$;

-- 2) Drop the table that stored browser push subscriptions
drop table if exists public.push_subscriptions;
