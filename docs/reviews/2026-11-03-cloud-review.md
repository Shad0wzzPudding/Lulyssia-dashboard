# Cloud review, 3 Nov 2026: rounds log

Branch `cloud-review-2026-11-03`: started from `main` at `57d208d` with the plan home-calendar
branches merged in their order (`1-green-start`, `2-circle-only`, `3-plus-button`, `summary`). Checks ran
on a local copy only (the app in a local browser with every backend request answered by test data).
Nothing reached the live project. Deno isn't available in this session.

## Order of areas
The 2 Nov run covered 10, 15 and 6; the 1 Nov evening run 10, 4, 2, 3 and 1; the 1 Nov run every area.
Since then the build changed Home (1) and the task and event forms (2, 3), and `main` changed the
search example (7). Order: 1 Home → 7 Select/search → 2 Tasks → 3 Events → then the areas covered
longest ago (1 Nov): 5 Settings → 8 Recent Changes → 9 Attachments → 11 Hooks → 12 LINE → 13 Migrations
→ 14 Phones/accessibility.

## Phase 1
- `main` (`cc40caf`, `8b0b02d`): read the diffs with sortAndFilter.ts's search and SortAndFilterBar.tsx's
  guide; found no new bug
- The build (3 code commits): read HomePage.tsx's calendar, date panel and plus menu, presetTime.ts and
  the two forms' openNew; found no new bug

## Phase 2
- Round 1 (1 Home): read HomePage.tsx's calendar, date panel, plus menu and details window; checked in the browser a fast Enter, Enter, Enter on the plus (one form, nothing saved; typing a title then Enter twice saves one task), the 30th at 22:40 (deadline 23:00), next month's 1st clicked from the grid (event start 1 Dec 09:00); found no new bug
- Round 2 (7 Select mode, search, sort and filters): read sortAndFilter.ts's searchItems, parseSearch and searchExample, and SortAndFilterBar.tsx's guide keys; ran the example against the real search on random titles (English, Thai, accents, joined with hyphens): never an empty list, the hidden word always hides some results but not all; found no new bug
- Round 3 (2 Tasks): read TaskFormDialog.tsx's open, reset, submit and close (a late answer from an earlier save can't close a form opened since: closing lets go of the save); checked a task made from the plus and Add Task in the browser; found no new bug
- Round 4 (3 Events): read EventFormDialog.tsx's open and submit and the start field's automatic end (a preset start leaves the end empty; changing the start then fills it, as for typing); checked an event made from the plus; found no new bug
- Round 5 (5 Settings): read LineSettings.tsx in full and the line_links table and rule; checked in the browser a first visit whose link making is refused; found 1 fixed (this commit: the card said "Sign in" to a signed-in user)
- Round 6 (8 Recent Changes and undo): read SwipeableActivityLogEntry.tsx in full, Home's undo handling (the 10-second wait, a second Enter ignored) and the revert mutation; found no new bug
- Round 7 (9 Attachments and storage clean-up): read AttachmentsField.tsx's upload, remove and open code; checked in the browser a file picked with no connection; found 1 fixed (`d7ff05c`: nothing happened and no message)
- Round 8 (11 Data hooks): read useSortPreference.ts, useLineLinked.ts, useLineStatus.ts, useUserNames.ts and useEditorSettings.ts's reads and writes of the settings row; checked in the browser a sort change whose read of the settings fails; found 1 fixed (this commit: the other settings were wiped)
