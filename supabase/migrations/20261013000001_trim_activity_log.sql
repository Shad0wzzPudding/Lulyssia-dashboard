-- Recent Changes (activity_log) keeps 30 days of entries. It was never trimmed, so it kept
-- growing, and since every saved old version counts as "still using" its attachment files,
-- the nightly attachment cleanup almost never deleted anything. The cleanup-attachments
-- function now calls trim_activity_log first (not in a dry run).

create or replace function public.trim_activity_log(p_dry_run boolean default false)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_dry_run then
    select count(*) into v_count from public.activity_log where created_at < now() - interval '30 days';
  else
    delete from public.activity_log where created_at < now() - interval '30 days';
    get diagnostics v_count = row_count;
  end if;
  return v_count;
end;
$$;

revoke execute on function public.trim_activity_log(boolean) from public, anon, authenticated;
grant execute on function public.trim_activity_log(boolean) to service_role;

-- Same as before, except that only Recent Changes entries from the last 30 days can still
-- bring a file back (so a dry run lists exactly what a real run deletes)
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
    -- Only entries still kept in Recent Changes (30 days, see trim_activity_log)
    where l.created_at >= now() - interval '30 days'
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
