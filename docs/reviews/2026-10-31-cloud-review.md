# Cloud review, 31 Oct 2026: rounds log

Branch `cloud-review-2026-10-31`: started from `main` at `3359d35` with the plan
in-progress-and-checklist branches merged in their order (`1-today-tabs`, `2-checklist`, `summary`).
Merge those branches first, or just this one: it contains them. Checks ran on a local copy only (the
app in a local browser with every backend request answered by test data). Nothing reached the live
project. Deno isn't available in this session, so `deno check` didn't run.

## Order of areas
The 30 Oct night run covered 6, 9, 10, 12 and 15; the 30 Oct wrap-indent run covered 1–5, 7, 8, 10,
11, 13 and 14. Since then the build changed Tasks (2), Events (3), the editor (10), Home (1),
Interests (4), the select-mode lists (7), the LINE text (12) and the hooks (11, new
`useChecklistTick.ts` from this review's fix), and the main commits touched the menu (6) and LINE (12).
Order: 2 Tasks → 3 Events → 10 Editor → 1 Home → 4 Interests → 7 Select/search → 12 LINE → 11 Hooks →
6 Navigation → 14 Phones/accessibility → 15 Time zones. Areas 5, 8, 9 and 13 are unchanged since the
30 Oct runs.

## Phase 1
- `main` (`77d409a`, `c04d02f`, `8fe98e3`, `2c237ef`): read the diffs with the code around them (menu
  closing when a window opens, the morning letter's "today" chips, the sticker's asset version, used
  only by line-webhook and send-line-daily); found no new bug
- The build (7 code commits): found 2 fixed: `da0ae72` (Today's Events showed a start or end on
  another day as if it were today) and `0678f06` (ticking boxes quickly on a card kept only the last
  tick; checked with 3 quick ticks on a slow save, ticks on two cards at once, a failed first save,
  and the build's own checklist test)

## Phase 2
- Round 1 (2 Tasks page): read TasksPage.tsx in full, todayTabs.ts, TodayTabs.tsx, taskDone.ts and useMultiSelect.ts; checked by tracing that each unfinished task lands in exactly one of Overdue, Today, In progress and Upcoming (no start, no deadline, due earlier today, started yesterday and due today, starting later today), that a tab hiding tasks also unpicks them without a loop, and the build's browser test of the sections and the midnight change; found no new bug
- Round 2 (3 Events page): read EventsPage.tsx's sections, status and card code; checked the same one-section rule for events with no start, no end, ended earlier today and running for days; found 1 proposed (an event with no start whose end has passed stays in Upcoming and is never cleared; so before the build too)
- Round 3 (10 Editor): read checklist.ts, formatted-text.tsx and the checklist parts of formatted-textarea.tsx (boxes, Enter, the Check button, clicks); checked 200,000 random texts with formatting marks, boxes and escapes: ticking line k changes only line k's box as shown, and the progress count matches the boxes drawn; reran the build's editor test (Check, undo, redo, Enter, Tab); found no new bug
- Round 4 (1 Home): read HomePage.tsx's tick functions, details window and Today lists, and InProgressCard.tsx; checked with the build's checklist test (Today lists, Main Focus, details window ticks and bars); found no new bug
- Round 5 (4 Interests): read InterestsPage.tsx's cards and DraggableInterestCard.tsx; checked ticking on both card kinds (build test); found no new bug
- Round 6 (7 Select mode, search, sort and filters): read the select, search and "Show more" code on Tasks and Events with the new tabs; checked that All picks only what's shown, a tab change unpicks hidden items, and the delete question's hidden counts include the Today section; found no new bug
- Round 7 (12 LINE functions): read lineText.ts and its callers in send-line-daily, send-line-reminders and send-line-overdue; checked formatDetail with checklist lines (empty, ticked, indented, bold) in a script; found 1 fixed (`cf574d9`: an empty checklist line showed as "[ ]")
- Round 8 (14 Phones and accessibility): read TodayTabs.tsx, ChecklistProgress.tsx and the card checkbox; checked at 360px in a browser: no sideways scroll, Space on a focused box ticks it, the boxes' screen reader names; found 1 fixed (`1e772fd`: every box was called "Tick" or "Untick")
- Round 9 (11 Data hooks): read useDashboardData.ts's queries, update, reorder and batch delete mutations next to useChecklistTick.ts; checked that the batch delete and reorder's list changes don't bring back deleted items or loop with the tick watcher (it only changes items it finds); found no new bug
- Round 10 (15 Time zones and dates): read the Today rules on Tasks, Events and Home (all use the device's day, as the daily list does since 30 Oct); checked the build's midnight test (23:59 → 00:01 moves today's items on); found no new bug
- Round 11 (8 Recent Changes and undo): read the activity log trigger and its order-only and renewal exclusions; checked that each tick save is one "updated" entry like any edit (quick ticks now make fewer entries) and undo restores that entry's description; found no new bug

Order changed from the plan above: Phones/accessibility ran before Hooks. Navigation (6) wasn't a round:
its only change since the 30 Oct night run is that run's own fix `77d409a`, reviewed in Phase 1.

Stopped: rounds 9, 10 and 11 found no new bug in a row, each on an area not covered before in this
run, and every area was covered in this run or the two 30 Oct runs with no changes since (5 Settings,
6 Navigation, 9 Attachments and 13 Migrations: 30 Oct).
