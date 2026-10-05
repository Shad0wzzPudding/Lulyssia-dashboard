-- 1) line_links.overdue_enabled exists in production but was never created by a migration
alter table public.line_links
  add column if not exists overdue_enabled boolean not null default true;

-- 2) Private storage bucket used for attachments (its storage policies already exist)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- 3) The app calls this as a logged-in user to roll daily tasks over to a new day.
--    A July migration revoked that permission, so the call has been failing silently.
--    The function rejects any p_user_id other than the caller's own auth.uid().
grant execute on function public.ensure_daily_tasks_for_today(uuid) to authenticated;