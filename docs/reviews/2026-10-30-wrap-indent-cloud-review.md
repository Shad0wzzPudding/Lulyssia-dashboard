# Cloud review, 30 Oct 2026 (wrap-indent): rounds log

Branch `cloud-review-2026-10-30-wrap-indent`: `main` at `48da2b3` with the 4 `plan/wrap-indent/*`
branches merged in their order (1 → 3, then summary), since the build isn't on `main` yet. Merge those
branches first, then this one. Checks run on a local copy only: the app in a local browser with every
backend request answered by test data. Nothing reached the live project.

## Order of areas
Earlier runs: 27 Oct (all 15 areas), 27 Oct "home and editor" (areas 1–6, 9–12, 14, 15), 30 Oct
(review only, no rounds). Since then the build changed the editor (10), how descriptions are shown on
Home and the cards (1, 2, 3, 4), the search (7) and what phones and screen readers get (14);
`useEditorSettings.ts` changed on 30 Oct (5, 11). Areas 8 and 13 were last covered three runs ago, so
they're due too. Order: 10 Editor → 1 Home → 7 Select mode, search, sort and filters → 2 Tasks →
3 Events → 4 Interests → 11 Data hooks → 5 Settings → 14 Phone layouts and accessibility →
8 Recent Changes and undo → 13 Migrations, access rules and cron. Areas 6, 9, 12 and 15 haven't changed
since the "home and editor" run and count as covered.

## Phase 1
- Reviewed `23443fc` and `e240ea1` on `main`: no new finding (nothing else uses the removed
  push_subscriptions table; its migration drops it).
- Reviewed the build's commits (items 1–3): 1 fixed (`31c33bf`): in the windows, indents were measured
  during the opening zoom and came out a few pixels short. Also compared on the old and new editor:
  Backspace at a line's start and mid-line, Delete at a line's end, typing over a selection across
  lines, undo, cut across a line break, select all and type or Backspace (same text after every step,
  the placeholder comes back when emptied).

## Phase 2
- Round 1 (10 Editor): read formatted-textarea.tsx and lineLead.ts in full (merged); checked in a browser a line with 60 spaces before its bullet (capped at half the box: 165 px of 330, also on the card) and Tab on all lines of a 200-line description (drawn in about 58 ms); found no new bug
- Round 2 (1 Home): read formatted-text.tsx and the description parts of HomePage.tsx and DraggableInterestCard.tsx; checked in a browser a Main Focus interest folded and unfolded and after a reload (indent measured right each time); found no new bug
- Round 3 (7 Select mode, search, sort and filters): read sortAndFilter.ts, SortAndFilterBar.tsx and useMultiSelect.ts; checked at 320px chips with long unbroken words (no sideways scroll), the School tag filter with `lab, !draft`, an empty search (chips row hidden) and a lone `!` (ignored); found no new bug
- Round 4 (2 Tasks): read TasksPage.tsx's description and search parts; checked the time to open the Tasks page with 150 tasks with indented descriptions and to filter them, on `main` and here (626/2186/2139 ms and 867 ms here against 616/2192/2188 ms and 869 ms on `main`); found no new bug
- Round 5 (3 Events): read EventsPage.tsx's description and search parts; checked in a browser an indented description (34 px for a 34 px lead) and the placeholder's example `meeting, party, !online`; found no new bug
- Round 6 (4 Interests): read InterestsPage.tsx's description and search parts; the same checks with `music, books, !someday`; found no new bug
- Round 7 (11 Data hooks): read useEditorSettings.ts (with `23443fc`) and the hooks changed since 27 Oct (only that one); checked in a browser the setting opened offline, then a failed pick; found 1 fixed (`22b039b`: it stayed on Quick space after coming back online)
- Round 8 (5 Settings): read EditorSettings.tsx and SettingsPage.tsx; checked again in a browser a refused save (message, choice put back), a change of account, and a save kept after a reload and in another browser; found no new bug
- Round 9 (14 Phone layouts and accessibility): checked in a browser at 360px that the chips add no Tab stops (13 with and without) and that screen readers hear "Showing items with lab or slides but not draft"; found no new bug
- Round 10 (8 Recent Changes and undo): read the Recent Changes parts of HomePage.tsx and useDashboardData.ts (unchanged since 26 Oct); checked that an edit from Home's pencil and one from the Tasks page send the same save, and that changes are logged by the database's `log_tasks_activity` / `log_events_activity` triggers either way; found no new bug
- Round 11 (13 Migrations, access rules and cron): replayed all 60 migrations on a local Postgres (PGlite; the 10 failures are pg_cron/pg_net and the cron jobs, which it lacks); every table has row level security; for each of the 10 tables another signed-in user sees, changes and deletes none of the owner's rows and an anonymous visitor sees none (`daily_task_days` has no rules on purpose: only `ensure_daily_tasks_for_today` touches it); no privileged function can be called anonymously; called as another user, `ensure_daily_tasks_for_today` refuses, `renew_my_recurring_tasks` leaves the other user's tasks alone and `revert_activity_log` doesn't find the other user's entry; found no new bug

Stopped: rounds 9, 10 and 11 found no new bug in a row, each on an area not covered before in this run;
areas 6, 9, 12 and 15 were covered in the "home and editor" run and haven't changed since.
