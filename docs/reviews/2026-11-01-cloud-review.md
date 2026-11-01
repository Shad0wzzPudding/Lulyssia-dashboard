# Cloud review, 1 Nov 2026: rounds log

Branch `cloud-review-2026-11-01`. Checks ran on a local copy only: the app in a local browser with
every backend request answered by test data (the iPhone status and home bars set through Chromium's
safe-area override). Nothing reached the live project.

## Order of areas
The 31 Oct run covered areas 1–4, 7, 8, 10–12, 14, 15; the 31 Oct late run covered 3, 5, 6, 9, 13, 14
and the angles double clicks, failed and slow saves, long words, many items and offline. Since then
only the editor (10) changed (the three phone checklist fixes). Order: 10 Editor → the angles not done
yet (keyboard only and screen reader names, access rules, the installed app) → then the areas with the
most code, with fresh eyes (2 Tasks, 11 Data hooks, 1 Home).

## Phase 1
- The first part of this run (review only): the 11 waiting commits, 2 fixed (`1a90e11`, `aad6bfd`);
  see REVIEW.md's history.

## Phase 2
- Round 1 (10 Editor): read the checklist parts of formatted-textarea.tsx (Enter on a checklist line, the Check button, the Backspace rule, ticking) and checklist.ts in full; checked in the browser typing after Check and Enter, Backspace on an emptied checklist line, ticking while the caret is elsewhere; found 1 proposed (no keyboard or screen-reader way to tick a box in the editor)
- Round 2 (angle: keyboard only and screen reader names): swept every page, the three forms, the drawer and Settings in the browser for controls with no name; found 2 fixed (`13fac70`: the 15 volume sliders had no name; `489c62b`: the description box had no name). Inputs named only by their placeholder and buttons named by their title were left as they are: browsers use those as names
- Round 3 (angle: access rules): read the line_links guard, revert_activity_log (only tasks, events and interests; only the caller's rows), lineImages.ts (only files in the owner's folder), the webhook's "Mark as done" (only the linked account's tasks) and who may call each LINE function (send-line-daily for a user: only their own link, with the month's allowance and 3-a-day limit; line-rich-menu and cleanup: cron secret only); found no new bug
- Round 4 (angle: the installed app): measured in the browser with the iPhone's status and home bar insets (390×844, 375×667, 393×852, 430×932) the task form with a long description; found 1 fixed (`a5f1313`: on the Dynamic Island iPhones the form's title and close X began under the status bar)
- Round 5 (2 Tasks page, fresh eyes): read TasksPage.tsx (cards, sections, Clear and Undo, copy, batch copy and delete) and taskDone.ts; checked in the browser the cards' names for screen readers and a tick; found 1 fixed (`c8a3915`: every card's Done, Copy, Edit and Delete buttons had the same names on all four lists, and Done comes before the title)
- Round 6 (11 Data hooks, fresh eyes): read useDashboardData.ts's batch delete, daily-list query and mutations, event mutations, Clear Past, the restore after Undo and topSortOrder; found no new bug
- Round 7 (1 Home, fresh eyes): read HomePage.tsx's tick wiring and details window, and useChecklistTick.ts in full; checked in the browser three quick ticks on a Home card with each save taking 0.7 s (two saves, the second with all three ticks; all shown ticked; the "mark done?" message once); found no new bug
- Round 8 (3 Events page, fresh eyes): read EventsPage.tsx's sections, card status, copy and batch copy (every field of an event is copied) and the delete question's counts; checked in the browser 31 upcoming and 23 past events (paging and Show more, no errors); found no new bug

Stopped: rounds 6, 7 and 8 found no new bug in a row, each on an area not covered before in this run,
and every area was covered in this run or the two before it (31 Oct and 31 Oct late) with no changes
since, except the editor, covered here.

## Second run (same day)
`main` hadn't changed and this branch wasn't merged yet, so this run went on here, starting with the
areas the first run suggested (Interests, Settings, the LINE functions), then the areas not re-read
today (Recent Changes, select mode and search, migrations, time zones).

- Round 9 (4 Interests): read InterestsPage.tsx in full (form, pin, copy, batch actions) and the interest mutations; checked in the browser select-mode Pin with the save refused, and the form at 390px; found 2 fixed (`2100e05`: "N interest(s) pinned" showed before the save and beside its failure; `032d0d2`: the form's date box had no label)
- Round 10 (5 Settings): read soundSettings.ts, SoundSettings.tsx and every play function in sounds.ts (each checks its own switch and volume, the cut-in's fallback too); found no new bug
- Round 11 (12 LINE functions): read line-webhook in full (follow, unfollow, Mark as done, today and its 3-a-day limit, notice, status, the switches, linking); ran the earlier Deno tests against the current webhook and send-line-daily (replies, a failed link, the morning letter's text fallback and marks removed after a failed push), deno check on all 7; found no new bug
- Round 12 (8 Recent Changes and undo): read SwipeableActivityLogEntry.tsx, Home's undo handling and the undo mutation; checked in the browser two quick Enters on an undo handle; found 1 fixed (`d392843`: two waiting undos, the first one impossible to cancel)
- Round 13 (7 Select mode, search, sort and filters): read sortAndFilter.ts's search; ran it on edge inputs (quoted phrases with commas, "!" alone, empty parts, a lone quote, words in checklist and bold descriptions); checked the unpin handle on Home for the same double press (it only sends the same unpin twice); found no new bug
- Round 14 (13 Migrations, access rules and cron): replayed all 60 migrations on a local Postgres (the 6 failures are pg_cron/pg_net, which it lacks); listed every table's rules; as one user tried to move a task into another account, add tasks and Recent Changes entries for another user, undo forged entries that re-create or reorder another user's task, and set up another user's daily list: all refused or without effect; found no new bug
- Round 15 (15 Time zones and dates): renewed repeating tasks in the local Postgres: monthly on the 31st (to 30 Nov, start kept 2 days before), monthly on the 1st at 05:00 Thai (the day before in UTC: stays on the 1st), on the 31st at 03:00 Thai, yearly on 29 Feb (to 28 Feb 2027); found no new bug

Stopped: rounds 13, 14 and 15 found no new bug in a row, each on an area not covered before in this
second run, and every area was covered today or in the two runs before (31 Oct and 31 Oct late).
