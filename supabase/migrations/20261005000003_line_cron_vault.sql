-- Scheduled LINE jobs.
--    The shared secret is read from Supabase Vault at run time (secret name: line_cron_secret),
--    so it never appears in this repository. See "Scheduled jobs" in the README.
do $$
declare
  r record;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron is not installed: skipping the LINE cron jobs';
    return;
  end if;

  for r in
    select jobid from cron.job
    where jobname in ('line-daily-digest-8am-bangkok', 'line-overdue-nudges', 'line-start-reminders')
  loop
    perform cron.unschedule(r.jobid);
  end loop;

  -- 08:00 Thai time (01:00 UTC)
  perform cron.schedule('line-daily-digest-8am-bangkok', '0 1 * * *', $job$
    select net.http_post(
      url := 'https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-line-daily',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'line_cron_secret' limit 1)
      ),
      body := jsonb_build_object('trigger', 'cron', 'invoked_at', now())
    );
  $job$);

  -- every hour
  perform cron.schedule('line-overdue-nudges', '0 * * * *', $job$
    select net.http_post(
      url := 'https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-line-overdue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'line_cron_secret' limit 1)
      ),
      body := jsonb_build_object('trigger', 'cron', 'invoked_at', now())
    );
  $job$);

  -- every 5 minutes
  perform cron.schedule('line-start-reminders', '*/5 * * * *', $job$
    select net.http_post(
      url := 'https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-line-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'line_cron_secret' limit 1)
      ),
      body := jsonb_build_object('trigger', 'cron', 'invoked_at', now())
    );
  $job$);
end;
$$;
