-- Missed-deadline nudges: check every 5 minutes instead of every hour, so a nudge arrives
-- within about 5 minutes of the deadline. Each task is still nudged once per deadline.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'line-overdue-nudges'),
  schedule := '*/5 * * * *'
);
