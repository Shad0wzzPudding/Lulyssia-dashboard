-- Recent Changes: only the newest change to an item can be undone, and undoing goes back one
-- step at a time.
-- Before, undo put back the whole saved row of any entry, so undoing an older entry also threw
-- away every later change to that item; and the undo itself was recorded as a new "updated"
-- entry, so the next undo would have redone it instead of going back further.
-- revert_activity_log does the undo in the database: it refuses when a newer change to the same
-- item exists, puts the item back without recording the undo, and removes the entry.
-- Only the columns present in the saved copy are restored, so an entry saved before a column
-- existed still restores (the new column keeps its current value or its default).
-- jsonb_exists() is used instead of the ? operator, which the Supabase SQL editor mishandles.

create or replace function public.revert_activity_log(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  l public.activity_log%rowtype;
  v_cols text;
  r record;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  select * into l from public.activity_log where id = p_id and user_id = v_uid;
  if not found then
    return 'not_found';
  end if;
  if l.item_type not in ('tasks', 'events', 'interests') then
    return 'unsupported';
  end if;

  -- Only the newest change to an item can be undone
  if l.item_id is not null and exists (
    select 1 from public.activity_log n
    where n.user_id = v_uid and n.item_id = l.item_id and n.created_at > l.created_at
  ) then
    return 'newer';
  end if;

  -- Undoing is not a change of its own: keep it out of Recent Changes
  perform set_config('app.skip_activity_log', 'on', true);

  if l.action_type = 'created' then
    execute format('delete from public.%I where id = $1 and user_id = $2', l.item_type)
      using l.item_id, v_uid;

  elsif l.action_type in ('updated', 'deleted') then
    if l.previous_data is null or (l.previous_data->>'user_id')::uuid is distinct from v_uid then
      return 'missing_data';
    end if;
    -- The saved copy's columns, as they exist in the table today
    select string_agg(quote_ident(c.column_name), ', ' order by c.ordinal_position)
      into v_cols
    from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = l.item_type
      and jsonb_exists(l.previous_data, c.column_name)
      and (l.action_type = 'deleted' or c.column_name not in ('id', 'user_id', 'created_at'));

    if l.action_type = 'updated' then
      execute format(
        'update public.%I t set (%s) = (select %s from jsonb_populate_record(null::public.%I, $1)) where t.id = $2 and t.user_id = $3',
        l.item_type, v_cols, v_cols, l.item_type
      ) using l.previous_data, l.item_id, v_uid;
    else
      execute format(
        'insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1)',
        l.item_type, v_cols, v_cols, l.item_type
      ) using l.previous_data;
    end if;

  elsif l.action_type = 'reordered' then
    if l.previous_data is null or jsonb_typeof(l.previous_data->'sort_orders') is distinct from 'array' then
      return 'missing_data';
    end if;
    for r in select * from jsonb_to_recordset(l.previous_data->'sort_orders') as x(id uuid, sort_order integer) loop
      execute format('update public.%I set sort_order = $1 where id = $2 and user_id = $3', l.item_type)
        using r.sort_order, r.id, v_uid;
    end loop;

  else
    return 'unsupported';
  end if;

  delete from public.activity_log where id = p_id;
  return 'ok';
end;
$$;

revoke execute on function public.revert_activity_log(uuid) from public, anon;
grant execute on function public.revert_activity_log(uuid) to authenticated;
