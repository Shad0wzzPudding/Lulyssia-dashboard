-- Tag names must be unique per user regardless of upper/lower case ("Work" = "work").
-- The existing UNIQUE (user_id, name) constraint is case-sensitive, so add a case-insensitive index.
-- If case-variant duplicates already exist, skip the index (instead of failing the migration)
-- and leave a warning; rename or merge those tags, then create the index manually.
do $$
begin
  if exists (
    select 1 from public.tags group by user_id, lower(name) having count(*) > 1
  ) then
    raise warning 'Skipped tags_user_lower_name_key: case-variant duplicate tag names exist';
  else
    create unique index if not exists tags_user_lower_name_key
      on public.tags (user_id, lower(name));
  end if;
end;
$$;
