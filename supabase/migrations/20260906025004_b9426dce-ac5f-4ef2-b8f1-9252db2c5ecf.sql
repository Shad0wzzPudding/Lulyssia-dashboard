select cron.unschedule(7);
select cron.schedule(
  'line-daily-digest-8am-bangkok',
  '0 1 * * *',
  $$
  select net.http_post(
    url := 'https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-line-daily',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret','REDACTED-see-README'
    ),
    body := jsonb_build_object('trigger','cron','invoked_at', now())
  );
  $$
);