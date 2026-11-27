# Cloud review, 27 Nov 2026 (second run): rounds log

Branch `cloud-review-2026-11-27-second`, started from the first 27 Nov run's branch
`cloud-review-2026-11-27` (not merged yet): `main` at `221dabc` hasn't changed, and doesn't have the
calendar-search and presets builds or that run's two fixes, so starting from `main` would have left out
all the new code. Merging this branch brings the first one too. Checks ran on a local copy only: test
pages in a local browser with the real components and an in-memory stand-in for the database, and PGlite
for the migrations. Nothing reached the live project.

## Order
Every area was covered in the first 27 Nov run (13, 11, 5, 2, 3, 1, 6, 8, 9, 12) or the 4 Nov and 5 Nov
runs (1, 10, 15, 4, 2, 5, 7, 3, 14), with no changes since but the first run's own fixes. So this run did
the second pass by angle, in the skill's order, looking first at the new code (calendar search, presets).

## Phase 1
- The commits after `221dabc` not yet reviewed: the first run's fixes `5b098cb` (the cards layer flash)
  and `a9323d2` (Lulyssia's questions take the focus). Read both with the code around them: the
  "applied" flag is reset on every opening and closing; the focus goes back to the opener only when it
  is still on the page (gone menu items, drawer rows and select-mode buttons are skipped; Safari, which
  doesn't focus buttons on a click, gets nothing restored, as before). Found no new bug.

## Phase 2
- Round 1 (long unbroken words, 320-430px): test page with a 70-letter one-word title, a 40-letter
  preset name, a long tag and a long web address; checked Home's calendar search (plain and with
  chips), the picked date, Settings' Presets card, the delete question, the cards layer and the
  details window at 320px, and every date line's edges at 320, 360, 390 and 430px. Found 1 fixed
  (a result's date line was cut off: "Start and end Sat 6 Mar 2027, 09:00–11:00" at 320 and 360px)
- Round 2 (double clicks and double Enter): double click and double Enter on the preset form's Create
  (one preset each), "Pick this one", a calendar search result, a calendar date and the front preset
  card. Found 2 fixed (Home: a double-clicked date unselected itself, a double-clicked result opened
  the details of the card that took its place; preset cards: a double click picked and unpicked)
- Round 3 (keyboard only and screen reader names): read the names of the new form parts (the preset
  form's switch, number box and unit, the description box named by its placeholder, the cards, ⓘ, the
  rows of the search results) and the arrow keys in the layer (the windows over it don't pass their
  keys to it); the layer's Tab order was checked in the first run. Found no new bug
- Round 4 (the installed app): read index.html (the app draws under the iPhone status bar and home bar)
  and every full-screen part's padding for them. Found 1 fixed (the preset cards' banner and buttons and
  the moment's Skip ignored them; checked that nothing changes where those spaces are zero; not seen on
  a real iPhone)
- Round 5 (failed and slow saves): read the save paths of the preset form (failure keeps the form and
  what was typed, offline refused, a late answer after closing ignored), the preset delete from Settings
  and from the details window, and the use count (a failure is silent and changes only the order);
  Apply needs no network. Found no new bug
- Round 6 (many items): Home's calendar search with 2,000 dated tasks (0.1-0.8s a keystroke in the
  development build, beyond "hundreds"); dragging the card stack with 60 presets and with 5 (the same
  frame times, so the number of cards isn't the cost). Found no new bug
- Round 7 (access rules): re-ran item 1's two-user test in PGlite, plus: another user can't move a
  preset to themselves or give theirs away, can't delete someone's tag, and copying someone's tag id into
  their own preset only leaves an id they can never see. Found no new bug

Stopped: rounds 5, 6 and 7 found no new bug in a row, each on an angle not covered before in this run,
and every area is covered in this run's first part (the first 27 Nov run) or the two before it.
