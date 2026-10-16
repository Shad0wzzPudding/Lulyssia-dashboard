# Plan: Cloud review proposals

**Status:** Draft <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `2d01ff1` (16 Oct 2026)
**Decided with the owner on:** 16 Oct 2026 (in progress)

## Goal

Settle the 11 "Needs decision" items from the cloud review of 15 Oct 2026 (roadmap.md, section
"Cloud review (15 Oct 2026)") and build the chosen fixes. Each item below starts as "Not decided yet";
a decision is written in as soon as the owner makes it, so the plan can be picked up again at the first
undecided item.

## Not in this plan

Anything beyond these 11 items. New ideas that come up go to the roadmap's backlog.

## Items

Build them in this order. Each one is its own branch and can be merged on its own unless it says
"Depends on".

### 1. Drag handle on unpinned interest cards
- **Problem:** on the Interests page the ⋮⋮ grab icon shows on unpinned cards only when the sort is not
  "User sort" (where they can't be dragged), and is hidden in "User sort" (where the list shows its own
  handle). The condition looks reversed (`sort !== 'user'` in `renderUnpinnedCard`).
- **Decision:** Not decided yet

### 2. About page 5px too wide on 320px phones
- **Problem:** the slanted About card sticks out on the right of a 320px screen.
- **Decision:** Not decided yet

### 3. Page-change train and the device's "reduce motion" setting
- **Problem:** with "reduce motion" on, the drawer's flashing slash is off, but the train crowd still
  slides across the whole screen.
- **Decision:** Not decided yet

### 4. Double-click on "Undo Clear" opens "Clear" again
- **Problem:** after Undo (Tasks' Clear Completed, Events' Clear Past) the Clear button appears exactly
  where Undo was, so a double click opens the "Clear …?" question again.
- **Decision:** Not decided yet

### 5. Installed app's "Add Task" shortcut does nothing
- **Problem:** long-pressing the app icon on Android offers "Add Task", which opens `/?action=add-task`,
  but the app never reads that, so it just shows Home.
- **Decision:** Not decided yet

### 6. Installed app's colours
- **Problem:** `public/manifest.json` still has template colours: a white launch screen and a blue
  (#2563eb) status bar around the dark cyan app.
- **Decision:** Not decided yet

### 7. Two sort choices that do nothing
- **Problem:** "Completed last" on Tasks and "Pinned first" on Interests: those items already have their
  own sections, so the list just keeps its loaded order.
- **Decision:** Not decided yet

### 8. Daily task edit window open over midnight
- **Problem:** Update then saves to yesterday's copy (shows "updated" but the change isn't on today's
  list or tomorrow's routine).
- **Decision:** Not decided yet

### 9. A failed save loses what was typed
- **Problem:** the add/edit form closes as soon as Create or Update is pressed; when the save fails
  (dropped connection, server error) the text and choices are gone. The daily list's quick add clears
  its box the same way.
- **Decision:** Not decided yet

### 10. Tasks page slows down with many tasks
- **Problem:** every card is redrawn on each search keystroke or tick: about 0.3s per tick at 60 tasks
  on a mid-range phone, 2s at 1,000 tasks.
- **Decision:** Not decided yet

### 11. Deadline before the start
- **Problem:** the task and event forms accept a deadline (or end) before the start, e.g. after moving a
  task's start past a hand-set deadline, so it turns Overdue (and sends a LINE nudge) before it starts.
- **Decision:** Not decided yet

## Questions answered while planning

- **Q:** Where are these from? **A:** The cloud review of 15 Oct 2026, roadmap.md "Cloud review
  (15 Oct 2026)", items marked "Needs decision" (with the evidence for each).

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

Filled in as items are decided.
