-- Indexes for looking up one person's rows. Tasks and events already have (user_id, sort_order);
-- interests and Recent Changes (newest first, and the "newer change to this item?" check of
-- revert_activity_log) had none.
create index if not exists interests_user_idx on public.interests (user_id);
create index if not exists activity_log_user_created_idx on public.activity_log (user_id, created_at desc);
create index if not exists activity_log_item_created_idx on public.activity_log (item_id, created_at);
