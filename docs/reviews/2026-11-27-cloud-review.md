# Cloud review, 27 Nov 2026: rounds log

Branch `cloud-review-2026-11-27`: `main` at `221dabc` with the plan builds merged in their order
(`plan/calendar-search/2-rise`, `plan/calendar-search/summary`, `plan/presets/4-moment`,
`plan/presets/summary`). Checks ran on a local copy only: PGlite for the database, and test pages in a
local browser with the real components and an in-memory stand-in for the database. Nothing reached the
live project. Deno isn't available in this session (no LINE function changed).

## Order of areas
The 5 Nov run covered 3, 1 (In progress window) and 14 (the window); the 4 Nov run 1, 10, 15, 4, 2, 5
and 7. Not covered in either: 6, 8, 9, 11, 12, 13. Changed since: migrations (13, presets table), the
hooks (11, `usePresets`, `useFormPresets`), Settings (5, Presets card), the task and event forms (2, 3,
preset cards) and Home (1, calendar search, `4739478`). Order: 13 Migrations → 11 Hooks → 5 Settings →
2/3 Task and event forms → 1 Home → 6 Navigation → 8 Recent Changes → 9 Attachments → 12 LINE.

## Phase 1
- `main` `97bfa6e..221dabc` (2 code commits: `4739478` Home's "still saving" pout, `fa8598b` the
  branch-delete deny rules; the rest are plan documents): read the diffs with the code around them (the
  0.6s rule only counts presses after the delete was sent; the pout's timer is reset on each press);
  found no new bug
- The calendar-search build (2 code commits): read the search, results, jump, focus and Rise code again;
  found no new bug
- The presets build (4 code commits): read the migration, hooks, Settings card, form, layer, carousel
  and moment; checked the moment step by step every 10ms in the browser; found 1 fixed (the cards layer
  came back for about 0.4s while the moment faded out; shown before and after the fix)

## Phase 2
- Round 1 (13 Migrations, row level security, cron): ran every migration in PGlite; listed every
  table's row level security, every policy and every "runs as owner" function with who may call it
  (only `ensure_daily_tasks_for_today`, `renew_my_recurring_tasks` and `revert_activity_log` are open to
  signed-in users, as before; the presets tag trigger is closed); found no new bug
- Round 2 (11 Data hooks): read usePresets.ts, useFormPresets.ts, useTags.ts and useDashboardData.ts
  lines 1-330 (queries, the batch delete, the first mutations); found no new bug
- Round 3 (5 Settings): read PresetManager.tsx, PresetFormDialog.tsx and SettingsPage.tsx with the code
  they call (the save guard, the failure path, the delete question); found no new bug
- Round 4 (2/3 the task and event forms): read both forms' preset paths (Apply, the start + X rule in
  both start boxes, the description question), PresetPicker.tsx, PresetCarousel.tsx, PresetMoment.tsx
  and LulyssiaConfirmDialog.tsx; in the browser a double click and a double Enter on "Apply preset",
  with and without reduced motion: the preset counts one use each time; found no new bug
- Round 5 (1 Home): read the calendar search (HomePage.tsx's search state, focus effect, Rise moments,
  CalendarSearchResults.tsx, calendarSearch.ts) with the delete-mode code and `4739478`'s pout; found
  no new bug

Paused after round 5 by choice, to make sure the notes were saved (the first summary called this
"running low on tokens"; the session wasn't actually cut off). Rounds 1-5 found no new bug, but areas
6, 8, 9 and 12 hadn't been covered in this run or the two before it, so the run carried on:

- Round 6 (6 Navigation, drawer and page transitions): read Navigation.tsx in full and Index.tsx's page
  switching, heading focus and sign-out; checked with a test page that Lulyssia's question (used by
  Sign out and every delete) left the keyboard focus on the button behind it: a second Enter pressed
  that button again (2 presses counted). Found 1 fixed (the question now focuses Nevermind~, or the
  first answer in the three-answer one, and gives the focus back to its opener; checked in the browser
  with the plain question and the preset flow: question, Cancel back to Apply, Add below, the moment,
  back to Presets; Home's delete flow still moves to the "−" by its own code)
- Round 7 (8 Recent Changes and undo): read the undo and remove-entry mutations in
  useDashboardData.ts and revert_activity_log as it stands (20261015000004): every step is limited to
  the signed-in person's own entry and items, a saved copy with another user_id is refused, an edit's
  undo leaves user_id, id, created_at and sort_order alone; found no new bug
- Round 8 (9 Attachments and storage clean-up): read unused_attachment_paths and the
  cleanup-attachments function: files any task, event, interest or Recent Changes entry points to are
  kept, uploads under a day old are kept, daily tasks and presets hold no files; only the service role
  can list the paths; found no new bug
- Round 9 (12 LINE functions): ran `deno check` on all seven functions (Deno from a scratch folder this
  time): all pass; read send-line-reminders in full (window, repeats across midnight, the sent mark
  undone on failure, card then text fallback); found 1 proposed (the card shows a Deadline / End on
  another day as a time only; the morning letter already writes the day)

Stopped: every area has now been covered in this run or the two before it, and rounds 7, 8 and 9 found
no new bug in a row, each on an area not covered before in this run.

