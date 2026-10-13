-- LINE "today" requests: at most 3 a day per person (the LINE "today" command and the Settings
-- "Send me today's digest now" button together). Each request is a push message, and the bot's
-- monthly allowance (300 on the free plan) is shared by everyone, so one person can't use it up.
-- The day is the Thai calendar day.

alter table public.line_links
  add column if not exists today_requests_date date,
  add column if not exists today_requests_count integer not null default 0;

-- Count one request for this person, if they have one left today.
-- Returns how many they have used today including this one (1-3), or -1 when all 3 are used.
create or replace function public.claim_today_request(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Bangkok')::date;
  v_used integer;
begin
  update public.line_links
  set today_requests_count = case when today_requests_date = v_today then today_requests_count + 1 else 1 end,
      today_requests_date = v_today
  where user_id = p_user_id
    and (today_requests_date is distinct from v_today or today_requests_count < 3)
  returning today_requests_count into v_used;
  return coalesce(v_used, -1);
end;
$$;

revoke execute on function public.claim_today_request(uuid) from public, anon, authenticated;
grant execute on function public.claim_today_request(uuid) to service_role;

-- The guard on line_links: as before, only the LINE webhook (service role) may set the LINE
-- identity fields; now the request count can't be changed from the app either (it would undo
-- the daily limit).
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
      new.today_requests_date := null;
      new.today_requests_count := 0;
    elsif tg_op = 'UPDATE' then
      if (new.line_user_id is not null and new.line_user_id is distinct from old.line_user_id)
         or (new.display_name is not null and new.display_name is distinct from old.display_name)
         or (new.linked_at is not null and new.linked_at is distinct from old.linked_at) then
        raise exception 'LINE link fields can only be set by the LINE webhook';
      end if;
      if new.today_requests_date is distinct from old.today_requests_date
         or new.today_requests_count is distinct from old.today_requests_count then
        raise exception 'The today request count can only be changed by the server';
      end if;
    end if;
  end if;
  return new;
end;
$$;
