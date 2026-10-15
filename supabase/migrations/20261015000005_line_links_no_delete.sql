-- The LINE "today" limit (3 a day per person, 20261014000000_line_today_limit.sql) could be reset
-- from the app's API: the count can't be changed, but a signed-in user could delete their own
-- line_links row and insert a new one, which starts at 0. After sending the link code in LINE
-- again they had 3 more requests, as often as they liked, so one person could still use up the
-- bot's shared monthly messages.
-- The app never deletes this row (it reads, creates and updates it; unlinking clears the LINE
-- fields), so signed-in users simply can't delete it any more. The server (service role) still can,
-- and the row still goes when its account is deleted.

revoke delete on public.line_links from authenticated;
