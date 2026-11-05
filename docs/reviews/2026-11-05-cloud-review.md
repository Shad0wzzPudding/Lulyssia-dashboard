# Cloud review, 5 Nov 2026: rounds log

Branch `cloud-review-2026-11-05` from `main` at `97bfa6e`. Checks ran on a local copy only: the app in a
local browser with every backend request answered by test data. Nothing reached the live project.

## Phase 1
- The 8 commits after `4285705`: `72275fe` (focus back on "−" after a failed delete), `259821c` (the
  "Show all" window's fixed size), `d201546` (Claude may delete branches, never main), and the "Show all"
  search: `2ed0bae`, `d9c1139`, `1e1e33f`, `647c8f6`, `97bfa6e`. Read the diffs with CollapsiblePreview.tsx
  in full; checked in the browser at 390 and 1200px and with reduced motion: "+N more" opens the window,
  "report" filters without the panel, "report, !draft" brings the panel and light cards (dark text on
  #d5e1e8), back to "report" takes it away, "zzz" says nothing matches, a tick inside saves once, the
  pencil opens the form over the window and Escape closes one then the other; no sideways scroll, no
  errors. Found 1 proposed: the new rule that keeps `main` from being deleted only matches one spelling.

## Order of areas
The 4 Nov run on `main` covered 1, 10, 15, 4, 2, 5 and 7; the 3 Nov second run 7, 1, 6, 5, 12, 8, 9, 11,
13 and 14. Not covered in either: 3 Events. Changed since: the "Show all" window (Home, and the Past
Events, completed tasks and In progress lists that use it). Order: 3 Events → 1 Home's In progress
window → 14 the window with the keyboard and screen readers.

## Phase 2
- Round 1 (3 Events): read EventsPage.tsx's Past Events preview and CollapsiblePreview.tsx; checked in the browser 14 past events: "Show all 14 past events", "meeting, !1" inside the window (Meeting 9, 6, 3, 0; "Meeting 12" hidden), a delete inside the window (1 request), no sideways scroll at 390px; found no new bug
- Round 2 (1 Home): read InProgressCard.tsx's light look on the panel; checked 7 in-progress tasks: "thesis, !5" (chapters 1 and 3), the light card's text (#0c1012 on #d5e1e8), a card opening its details over the window; found no new bug
- Round 3 (14 Phone layouts and accessibility): walked the window with the keyboard at 1200px: Enter on "+N more", Tab to the search then the cards' pencils, Escape; every control named, the chips read as "Showing items with … but not …"; found no new bug. Not counted: after Escape the focus stays on the page, not on "+N more", which dialog.tsx does on purpose (it would scroll the page back)

Stopped: rounds 1, 2 and 3 found no new bug in a row, each on an area not covered before in this run,
and every area was covered in this run or the two before it (4 Nov on `main`, 3 Nov second).
