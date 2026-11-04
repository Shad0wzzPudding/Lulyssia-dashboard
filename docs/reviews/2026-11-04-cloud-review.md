# Cloud review, 4 Nov 2026: rounds log

Done on branch `plan/home-delete/summary` as the owner asked ("in this branch"): `main` at `4233001`
plus the plan home-delete build (`plan/home-delete/2-dont-ask-today`, which contains item 1, merged in).
Checks ran on a local copy only (the app in a local browser with every backend request answered by test
data). Nothing reached the live project. Deno isn't available in this session.

## Order of areas
The two 3 Nov runs covered 1-3, 5-9 and 11-14; 10 Editor and 15 Time zones were last covered on 2 Nov,
4 Interests on 1 Nov (evening). Since then the build changed Home (1) and the confirm window used
everywhere, and `2d2014b` changed boxes on Tasks (2), Settings' tags (5) and search (7). Order: 1 Home →
10 Editor → 15 Time zones → 4 Interests → 2 Tasks → 5 Settings → 7 Search.

## Phase 1
- `main` (`2d2014b`, `a235a5e`): read the diffs with the boxes, presetTime.ts and the task form's
  openNew (a start equal to the deadline at 23:59 is still accepted; a past day gets no start); found no
  new bug
- The build (2 code commits): read the date panel's delete mode, the window and the "don't ask" memory;
  found no new bug (the round below found one in it)

## Phase 2
- Round 1 (1 Home): read HomePage.tsx's date panel, delete mode, delete window and focus handling; checked in the browser a delete that fails then a retry (one request each, the item stays then goes), a task made from the plus while delete mode is on (it gets its delete button); found 1 fixed (the fix commit, `d7c50f7` on the branch: the focus was left nowhere after a failed delete)
- Round 2 (10 Editor): unchanged since the 2 Nov run; ran inlineFormat.ts's writer and reader on 300,000 random styled texts made with the editor's own style toggles (stars, tildes, backslashes, bars, brackets, Thai, line breaks): every one reads back as the same characters and styles (emoji count as two halves on both sides, as in the editor); found no new bug
- Round 3 (15 Time zones and dates): read presetTime.ts, thaiDate.ts, homeDeleteNoAsk.ts and dateOrder.ts; ran the plus's start and deadline for today, tomorrow and 23:59, in Thai time and New York time (with its clock changes), and "Don't ask again today" across Thai midnight (round 1 of the build log); found no new bug. Seen, not counted: on a device that changes its clocks (not Thailand), at 01:00-02:00 on the night clocks go back, "next full hour" reads 01:00, before "now", so the task form refuses it until a time is changed; the date-time box can't hold the repeated hour, so there's no clean fix
- Round 4 (4 Interests): read InterestsPage.tsx's form submit, pin, copy and batch actions, and every confirm window's onConfirm (the window now passes whether its box was ticked: all six windows given a function directly take no argument, so none is affected); found no new bug
- Round 5 (2 Tasks): read the boxes changed by `2d2014b` (task form's dates and "Every N", the daily list's time box) with the code around them; checked in the browser at 360, 390, 800 and 1280 px: 16px on phones, 14px from 768 px, no sideways scroll; found no new bug
- Round 6 (5 Settings): read TagManager.tsx's and TagPicker.tsx's name boxes; checked the same widths in Settings (16px / 14px, no sideways scroll); found no new bug
- Round 7 (7 Select mode, search, sort and filters): read SortAndFilterBar.tsx's search box and its example and guide; checked at the same widths that the guide's text size matches the typed text (so it lines up) and the example shows; found no new bug

Stopped: rounds 2 to 7 found no new bug in a row, each on an area not covered before in this run, and
every area was covered in this run or the two 3 Nov runs with no changes since.
