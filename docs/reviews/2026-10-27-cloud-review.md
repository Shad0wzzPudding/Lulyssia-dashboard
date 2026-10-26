# Cloud review, 27 Oct 2026: rounds log

Branch `cloud-review-2026-10-27` (from `main` at `789692e`). Checks run on a local copy only: the app
in a local browser with every backend request answered by test data, migrations on a local Postgres,
LINE functions under Deno with LINE and the database faked. Nothing reached the live project.

## Order of areas
Earlier runs: 15 Oct (all 15 areas, rounds log in roadmap.md), 25 Oct (review only, no rounds), 26 Oct
(areas 1–6, docs/reviews/2026-10-26-cloud-review.md). Every area's files changed since it was last
covered, or it was covered more than two runs ago (15: time zones), so all 15 are due. Order: the ones
covered longest ago first, then those covered on 26 Oct and changed since:
7 Select mode, search, sort and filters → 8 Recent Changes and undo → 9 Attachments and storage
clean-up → 10 Editor → 11 Data hooks → 12 LINE functions → 13 Migrations, access rules and cron →
14 Phone layouts and accessibility → 15 Time zones and dates → 1 Home → 2 Tasks → 3 Events →
4 Interests → 5 Settings → 6 Navigation.

## Phase 1
- Reviewed the 8 waiting commits (`85ba844`, `246dbf1`, `86bfd64`, `fcad22f`, `6a00462`, `fff28a5`,
  `019fd3a`, `fe1bd55`) and `789692e`: no new finding.

## Phase 2
- Round 1 (7 Select mode, search, sort and filters): read sortAndFilter.ts, useMultiSelect.ts, selectMode.ts, SortAndFilterBar.tsx; checked in a browser a tag filter plus a search on Tasks and Events with 40 items each (10 match; "All" picks exactly those 10); found no new bug
- Round 2 (8 Recent Changes and undo): read the undo parts of HomePage.tsx and useDashboardData.ts and revert_activity_log (20261015000004); checked on a local Postgres that a bulk delete of 5 tasks in one statement logs 5 entries and undoing one of them restores that task in its old place; found no new bug
- Round 3 (9 Attachments and storage clean-up): read AttachmentsField.tsx in full, cleanup-attachments and lineImages.ts (unchanged since 15 Oct); checked in a browser removing an attachment while another file uploads slowly; found 1 fixed (the removed file came back)
- Round 4 (10 Editor): read formatted-textarea.tsx's redraw, caret and toolbar code (the 23 Oct scroll fix); checked in a browser Bold in the middle of a 40-line description (scroll kept at 300px) and "• Add" at the end (caret in view); found no new bug
- Round 5 (11 Data hooks): read useDashboardData.ts (clear, restore, batch delete, reorder, form saves) and searched every hook for long id lists; checked in a browser Clear Completed with 451 completed tasks before and after; found 1 fixed (one 17.7 KB request address)
- Round 6 (12 LINE functions): read the 25 Oct wording changes and the functions' id filters (only linked users, a handful); ran deno check on all 7 functions, the 08:00 run and the webhook under Deno with LINE and the database faked; found no new bug
- Round 7 (13 Migrations, access rules and cron): replayed all 60 migrations on a fresh local Postgres (all October ones apply; the 6 failures are pg_cron/pg_net, which the local Postgres lacks), listed the access rules and which functions a signed-in user and an anonymous visitor can call; found no new bug
- Round 8 (14 Phone layouts and accessibility): checked in a browser every page (Home, Tasks, Events, Interests, Settings, About) at 360, 390 and 430px with a web-address title and a title with runs of spaces (no sideways scroll), and counted unnamed controls on every page and in the add forms (none, besides the hidden file picker); found no new bug
- Round 9 (15 Time zones and dates): read useLocalToday.ts and the daily list's date handling; checked in a browser in Thai time from 23:58 on 31 Oct past midnight (Today's Tasks and the daily list move to 1 Nov), and a device in New York and in Tokyo (each asks for its own date, which the server accepts); found no new bug
- Round 10 (1 Home): read HomePage.tsx's Main Focus order and DraggableInterestCard.tsx's drag code; checked in a browser dragging the third of three pinned interests to the top (order saved and kept after a reload); found no new bug
- Round 11 (2 Tasks, daily and repeating): read TasksPage.tsx's submit and anchor logic; checked in a browser editing a repeating task's title only (its "count repeats from" date kept) and moving its deadline (reset to the new deadline); found no new bug
- Round 12 (3 Events): read EventsPage.tsx's form and cards; checked in a browser on a phone the form's "End" field, an end before the start (refused with the End message, nothing sent), clearing the start (saves), and the cards' "End:" labels; found no new bug
- Round 13 (4 Interests): read InterestsPage.tsx's pin and edit code; checked in a browser that pinning from a card sends only the pin, and an edit sends neither the pin nor the place in "User sort" (a double space in the title kept); found no new bug
- Round 14 (5 Settings): read useTags.ts and names.ts; checked in a browser creating "  WORK " beside an existing "Work" (refused with "Tag already exists", nothing sent); found no new bug
- Round 15 (6 Navigation and page changes): read Navigation.tsx's menu, Escape handling and the window count (useWindowOpen.ts); checked in a browser that Home's "+N more" window also hides the round menu button and Esc brings it back, and that Esc closes the round menu; found no new bug

Stopped: all 15 areas covered in this run, and rounds 6 to 15 found no new bug in a row.
