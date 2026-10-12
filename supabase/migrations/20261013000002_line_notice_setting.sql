-- "Notice before" (the 08:00 heads-up the day before) gets its own on/off, separate from the
-- morning letter: before, turning the letter off silently stopped the notices too.
-- On by default, so items already flagged keep getting their notice.
alter table public.line_links add column if not exists notice_enabled boolean not null default true;
