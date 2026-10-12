-- Repeating tasks: remember the first deadline, so every repeat is counted from it.
-- Counting from the previous deadline let a monthly task due on the 31st slip to the 28th
-- after February and stay there. Existing tasks get it from the app the next time they renew
-- (no backfill here, which would have added an "updated" entry per task to Recent Changes).
alter table public.tasks add column if not exists recurrence_anchor timestamptz;
