-- Only the LINE webhook (service role) may set the LINE identity fields on line_links.
-- Logged-in users may still clear them (the "refresh code" button sets them to null).
create or replace function public.guard_line_links_writes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.line_user_id := null;
      new.display_name := null;
      new.linked_at := null;
    elsif tg_op = 'UPDATE' then
      if (new.line_user_id is not null and new.line_user_id is distinct from old.line_user_id)
         or (new.display_name is not null and new.display_name is distinct from old.display_name)
         or (new.linked_at is not null and new.linked_at is distinct from old.linked_at) then
        raise exception 'LINE link fields can only be set by the LINE webhook';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_line_links_writes on public.line_links;

create trigger guard_line_links_writes
before insert or update on public.line_links
for each row execute function public.guard_line_links_writes();