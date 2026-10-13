-- Deleting a tag also takes it off the tasks, events and interests that had it.
-- Before, the id stayed in their tag_ids. Nothing showed it, but "Sort by tag" looked only at an
-- item's first tag, so an item whose first tag was deleted sorted as if it had no tags.
-- Taking a tag off is not a change of its own, so it stays out of Recent Changes.

create or replace function public.remove_deleted_tag_from_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_skip text := current_setting('app.skip_activity_log', true);
begin
  perform set_config('app.skip_activity_log', 'on', true);
  update public.tasks set tag_ids = array_remove(tag_ids, old.id)
    where user_id = old.user_id and old.id = any(tag_ids);
  update public.events set tag_ids = array_remove(tag_ids, old.id)
    where user_id = old.user_id and old.id = any(tag_ids);
  update public.interests set tag_ids = array_remove(tag_ids, old.id)
    where user_id = old.user_id and old.id = any(tag_ids);
  perform set_config('app.skip_activity_log', coalesce(v_skip, ''), true);
  return old;
end;
$$;

revoke execute on function public.remove_deleted_tag_from_items() from public, anon, authenticated;

drop trigger if exists remove_deleted_tag_from_items on public.tags;
create trigger remove_deleted_tag_from_items
  after delete on public.tags
  for each row execute function public.remove_deleted_tag_from_items();

-- Tags already deleted: take them off now (also kept out of Recent Changes)
do $$
begin
  perform set_config('app.skip_activity_log', 'on', true);
  update public.tasks t set tag_ids = coalesce(
    (select array_agg(id order by n) from unnest(t.tag_ids) with ordinality as x(id, n)
      where exists (select 1 from public.tags g where g.id = x.id)), '{}')
  where exists (select 1 from unnest(t.tag_ids) as x(id) where not exists (select 1 from public.tags g where g.id = x.id));
  update public.events t set tag_ids = coalesce(
    (select array_agg(id order by n) from unnest(t.tag_ids) with ordinality as x(id, n)
      where exists (select 1 from public.tags g where g.id = x.id)), '{}')
  where exists (select 1 from unnest(t.tag_ids) as x(id) where not exists (select 1 from public.tags g where g.id = x.id));
  update public.interests t set tag_ids = coalesce(
    (select array_agg(id order by n) from unnest(t.tag_ids) with ordinality as x(id, n)
      where exists (select 1 from public.tags g where g.id = x.id)), '{}')
  where exists (select 1 from unnest(t.tag_ids) as x(id) where not exists (select 1 from public.tags g where g.id = x.id));
  perform set_config('app.skip_activity_log', '', true);
end $$;
