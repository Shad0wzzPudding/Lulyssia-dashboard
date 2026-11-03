# Cloud review, 3 Nov 2026 (second run): rounds log

Branch `cloud-review-2026-11-03-second` from `main` at `98a3f2b` (the earlier run's branch
`cloud-review-2026-11-03` wasn't merged, so its 3 fixes aren't in what this run checked). Checks ran on a local copy only: the app in a
local browser with every backend request answered by test data, Deno for the functions and a local
Postgres for the migrations. Nothing reached the live project.

## Phase 1
- `98a3f2b` (a comment moved back above the line it explains) and `9f7be51` (the /cloud-build skill puts
  each item's log in its own commit): read both; no new finding.

## Order of areas
The 2 Nov run covered 10, 15 and 6; the 1 Nov evening run 10, 4, 2, 3 and 1. Since then the search bar
(7), Home's calendar (1), the menu and drawer focus (6) and the editor (10, reviewed on 2 Nov) changed.
Order: 7 Search → 1 Home's calendar plus → 6 Navigation focus → then the areas not covered in the last
two runs: 5 Settings, 12 LINE functions, 8 Recent Changes, 9 Attachments, 11 Data hooks, 13 Migrations,
14 Phone layouts and accessibility.

## Phase 2
- Round 1 (7 Select mode, search, sort and filters): read sortAndFilter.ts's searchExample and SortAndFilterBar.tsx's SearchField; checked in the browser at 390 and 1200px an example made from seven titles (one Thai), the faint rest lined up with the typed text, → filling it in (3 of 5 matches shown, the hidden word works), Tab moving on; measured every text box's font size at 390px; found 1 proposed (boxes under 16px zoom the page on iPhones)
- Round 2 (1 Home): read the calendar plus (HomePage.tsx's openNewOnDate, presetTime.ts, the forms' openNew); checked in the browser with the mouse and the keyboard: New event and New task on the 20th open on 09:00 with the focus in the title, Escape closes; found no new bug
- Round 3 (6 Navigation): read the heading focus code in Index.tsx and the drawer's close focus in Navigation.tsx; checked in the browser a mouse pick (focus on the heading, no ring) and a keyboard pick (ring, next Tab continues in the page); found no new bug
- Round 4 (5 Settings): read LineSettings.tsx's load, switches, new code, test send and copy; checked in the browser a refused switch (flips back, message) and a double click on the test send (1 request), no sideways scroll at 390px; found no new bug
- Round 5 (12 LINE functions): deno check on all 7 functions; re-ran the webhook and morning-letter tests; ran lineText.ts's formatDetail on checklists (☐/☑, indents, an empty box line, capital X), formatting marks, empty and very long descriptions; found no new bug
- Round 6 (8 Recent Changes and undo): re-ran the undo checks: a double Enter sends one undo, Undo cancels it, a refused undo puts the entry back, leaving Home still sends a waiting undo; found no new bug
- Round 7 (9 Attachments): re-ran the upload checks: two files refused (a message each, the form keeps its changes and stays usable), a retry, the save waiting for an upload; found no new bug
- Round 8 (11 Data hooks): read useLineStatus.ts and useTouchReorder.ts in full; checked that both containers using touch reordering are always rendered when the hook sets up its listeners (DragReorderList and Home's Today Events row); found no new bug
- Round 9 (13 Migrations, access rules and cron): replayed all 60 migrations on a local Postgres (the 6 failures are pg_cron/pg_net, which it lacks); every table has row level security; no privileged function can be called anonymously; the three a signed-in user can call (revert_activity_log, renew_my_recurring_tasks, ensure_daily_tasks_for_today) all check the caller; found no new bug
- Round 10 (14 Phone layouts and accessibility): swept every page, the three forms, the drawer and Settings for controls without a name (all named); every page at 360, 390 and 430px (no sideways scroll); found no new bug

Stopped: nine rounds in a row found no new bug, each on an area not covered before in this run, and every
area was covered in this run or the two before it.
