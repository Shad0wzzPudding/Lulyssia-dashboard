# Cloud review, 31 Oct 2026 (late): rounds log

Branch `cloud-review-2026-10-31-late`: started from `cloud-review-2026-10-31` at `72fdf40` (the 31 Oct
cloud review, plus the owner's review of plan in-progress-and-checklist: `9f266e3`, `d339a65`, `72fdf40`),
not merged into `main` yet. Merge this branch alone: it contains all of it. Run in the owner's local
Claude Code session on Windows, with Deno available (`npx deno`). Browser checks ran on the local dev
server against the test account, with any request that would write made to fail or answered inside the
page: nothing was written to the live project.

## Order of areas
Areas as in earlier logs: 1 Home, 2 Tasks, 3 Events, 4 Interests, 5 Settings, 6 Navigation, 7 Select
mode/search/sort/filters, 8 Recent Changes and undo, 9 Attachments, 10 Editor, 11 Data hooks, 12 LINE
functions, 13 Migrations/access rules/cron, 14 Phones and accessibility, 15 Time zones and dates.
The 31 Oct run covered 1–4, 7, 8, 10–12, 14 and 15; the 30 Oct night run 6, 9, 10, 12 and 15; areas 5
and 13 were last covered by the 30 Oct wrap-indent run (three runs back). Since 31 Oct, Events (3) and
the messages' position (14) changed (`d339a65`, `9f266e3`). Order: 5 Settings → 13 Migrations → 3 Events
→ 14 Phones and accessibility → 9 Attachments → 6 Navigation → then the second pass by angle.

## Phase 1
- The 6 waiting commits (`da0ae72`, `0678f06`, `cf574d9`, `1e772fd`, `9f266e3`, `d339a65`): read each
  diff with the code around it; traced the quick-ticks code (`useChecklistTick.ts`) through saves,
  list reloads and a failed save; checked that Clear Past deletes by ids only, so undated past events
  are really removed. Ran tsc, eslint, build and `deno check` on the 4 LINE functions (the build and
  the 31 Oct run couldn't). Found no new bug.

## Phase 2
- Round 1 (5 Settings): read SettingsPage.tsx, NameSettings.tsx, useUserNames.ts, names.ts, TagManager.tsx, useTags.ts, LineSettings.tsx, useEditorSettings.ts, soundSettings.ts and SoundSettings.tsx; checked the rename path with a tag changed elsewhere, and the LINE card in the browser with its read made to fail (no write attempted) and then recovering on focus; found 2 fixed (`b750e2e`: the rename box kept the name the row had when Settings opened; `ea65359`: a failed read of the LINE link said "Sign in" and tried to make a new link)
- Round 2 (13 Migrations, access rules and cron): no migration changed since 16 Oct, and no local Postgres here, so by reading: listed every table's row rules and grants, the three functions a signed-in user can call (`ensure_daily_tasks_for_today` checks the caller and the date; its old one-argument version was dropped on 6 Oct; `revert_activity_log` only uses the caller's own entries, checks a deleted item's saved copy belongs to the caller, and only updates the caller's rows; `renew_my_recurring_tasks` uses the caller only), the storage rules (each user's own folder; an update keeps the folder rule) and the LINE link guard (users can't set their LINE id or reset the "today" count); found no new bug
- Round 3 (3 Events): read EventsPage.tsx in full with todayTabs.ts and TodayTabs.tsx; checked by tracing that every event lands in exactly one section (no start and no end, start only, ended earlier today, undated and past) and how each section's cards are coloured; found 1 fixed (`7e82626`: an undated event under Past Events kept the blue "upcoming" colour)
- Round 4 (14 Phones and accessibility): checked in the browser where both kinds of message sit next to the round menu button at 975px and 377px; found 1 fixed (`5f83d33`: the plain messages still sat partly under the button on computers)
