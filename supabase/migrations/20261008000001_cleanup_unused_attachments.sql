-- Removing an attachment keeps its stored file: a copied item may share it, and
-- undo (Recent Changes) can put it back. This lists the files nothing points to
-- anymore, so the cleanup-attachments function can delete them once a day.

-- Stored attachment files older than p_min_age that no task, event or interest
-- uses, and that no Recent Changes entry could bring back
create or replace function public.unused_attachment_paths(p_min_age interval default interval '1 day')
returns setof text
language sql
stable
security definer
set search_path = public, storage
as $$
  with used as (
    select a->>'path' as path
    from public.tasks t,
      jsonb_array_elements(case when jsonb_typeof(t.attachments) = 'array' then t.attachments else '[]'::jsonb end) a
    union
    select a->>'path'
    from public.events e,
      jsonb_array_elements(case when jsonb_typeof(e.attachments) = 'array' then e.attachments else '[]'::jsonb end) a
    union
    select a->>'path'
    from public.interests i,
      jsonb_array_elements(case when jsonb_typeof(i.attachments) = 'array' then i.attachments else '[]'::jsonb end) a
    union
    select a->>'path'
    from public.activity_log l,
      jsonb_array_elements(case when jsonb_typeof(l.previous_data->'attachments') = 'array' then l.previous_data->'attachments' else '[]'::jsonb end) a
  )
  select o.name
  from storage.objects o
  where o.bucket_id = 'attachments'
    -- Skip recent uploads: a file added to a form that is not saved yet
    and o.created_at < now() - p_min_age
    and not exists (select 1 from used where used.path = o.name);
$$;

revoke execute on function public.unused_attachment_paths(interval) from public, anon, authenticated;
grant execute on function public.unused_attachment_paths(interval) to service_role;

-- Daily at 03:00 Thai time (20:00 UTC). Uses the same Vault secret as the LINE jobs.
do $$
declare
  r record;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron is not installed: skipping the attachment cleanup job';
    return;
  end if;

  for r in select jobid from cron.job where jobname = 'attachments-cleanup' loop
    perform cron.unschedule(r.jobid);
  end loop;

  perform cron.schedule('attachments-cleanup', '0 20 * * *', $job$
    select net.http_post(
      url := 'https://orlypvtllefclnwjayyf.supabase.co/functions/v1/cleanup-attachments',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'line_cron_secret' limit 1)
      ),
      body := jsonb_build_object('trigger', 'cron', 'invoked_at', now())
    );
  $job$);
end;
$$;
