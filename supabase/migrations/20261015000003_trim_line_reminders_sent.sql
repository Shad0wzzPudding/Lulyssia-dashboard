-- line_reminders_sent (the record of which LINE reminders, nudges and repeats went out) grew by one
-- row per message and was never trimmed. Its rows only stop a message from going out twice, and
-- every check looks back at most 3 days (missed deadlines), so rows for anything more than a week
-- old are no longer needed. A nightly job deletes them.

create or replace function public.trim_line_reminders_sent()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.line_reminders_sent where occurrence_at < now() - interval '7 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.trim_line_reminders_sent() from public, anon, authenticated;
grant execute on function public.trim_line_reminders_sent() to service_role;

-- Every night at 03:30 Thai time (20:30 UTC)
do $$
declare
  r record;
begin
  for r in select jobid from cron.job where jobname = 'trim-line-reminders-sent' loop
    perform cron.unschedule(r.jobid);
  end loop;
  perform cron.schedule('trim-line-reminders-sent', '30 20 * * *', 'select public.trim_line_reminders_sent()');
end $$;
