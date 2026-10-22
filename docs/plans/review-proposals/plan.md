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
- **Decision:** Remove the ⋮⋮ icon from the unpinned cards.
- **Branch:** `plan/review-proposals/1-interest-drag-icon`
- **What it does:** unpinned interest cards no longer show the grab icon in any sort. In "User sort" the
  drag list's own handle still shows where to drag.
- **Done when:**
  - [ ] the `GripVertical` icon line in `renderUnpinnedCard` (InterestsPage.tsx) is gone, and the
    unused import with it if nothing else uses it
  - [ ] "User sort" on Interests still shows the list's handle and dragging still works
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** the Interests page in "User sort" and in another sort.
- **Needs:** nothing
- **Depends on:** nothing

### 2. About page 5px too wide on 320px phones
- **Problem:** the slanted About card sticks out on the right of a 320px screen.
- **Decision:** Fix it on screens narrower than about 360px only.
- **Branch:** `plan/review-proposals/2-about-narrow-phones`
- **What it does:** below about 360px the About card gets a little less tilt or side margin (whichever
  keeps it closest to its current look) so the page fits the screen. Wider screens look exactly the same.
- **Done when:**
  - [ ] at 320px the About page is no wider than the screen (document scroll width ≤ 320)
  - [ ] at 360px, 390px and a computer width the card looks unchanged (same tilt and margins)
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** the About page on a narrow phone (or a 320px browser window).
- **Needs:** nothing
- **Depends on:** nothing

### 3. Page-change train and the device's "reduce motion" setting
- **Problem:** with "reduce motion" on, the drawer's flashing slash is off, but the train crowd still
  slides across the whole screen.
- **Decision:** When the device asks for reduced motion, skip the train.
- **Branch:** `plan/review-proposals/3-reduce-motion-train`
- **What it does:** with the device's "reduce motion" setting on, page changes behave as if Settings'
  "Page transitions" switch were off: no train crowd and no train sound. In Settings that switch shows as
  off and can't be turned on, with a short note, the same way "Reduce flashing" already does ("Your
  device asks for less motion, so…").
- **Rules decided:** the saved switch value isn't changed; turning the device setting off brings the
  owner's own choice back.
- **Done when:**
  - [ ] with reduced motion emulated (browser dev tools, prefers-reduced-motion: reduce), changing page
    shows no train and plays no train sound
  - [ ] without it, the train works as before and follows the Settings switch
  - [ ] Settings shows the switch off and disabled with the note while reduced motion is on
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** a page change with the device's reduce-motion setting on and off, and the
  note in Settings → Animating menu.
- **Needs:** nothing
- **Depends on:** nothing

### 4. Double-click on "Undo Clear" opens "Clear" again
- **Problem:** after Undo (Tasks' Clear Completed, Events' Clear Past) the Clear button appears exactly
  where Undo was, so a double click opens the "Clear …?" question again.
- **Decision:** After Undo, the Clear button appears only after about a second.
- **Branch:** `plan/review-proposals/4-clear-after-undo`
- **What it does:** on Tasks (Clear Completed) and Events (Clear Past), pressing Undo brings the items
  back as now, but the Clear button stays hidden for about one second before it shows again, so a
  double click on Undo can't land on it.
- **Rules decided:** during that second the button's space is kept (invisible, not clickable), so the
  buttons around it don't jump; then it fades in. Only after Undo: the button shows normally at all
  other times (page load, after the 10-second Undo window runs out).
- **Done when:**
  - [ ] right after Undo, the Clear button can't be seen or clicked for about one second, on both pages
  - [ ] after that it appears in its usual place and works
  - [ ] the other buttons in that row don't move when it hides or appears
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** Clear Completed → Undo on Tasks (and Clear Past → Undo on Events), including
  a quick double click on Undo.
- **Needs:** nothing
- **Depends on:** nothing

### 5. Installed app's "Add Task" shortcut does nothing
- **Problem:** long-pressing the app icon on Android offers "Add Task", which opens `/?action=add-task`,
  but the app never reads that, so it just shows Home.
- **Decision:** Make the shortcut open the Tasks page with the new-task form open.
- **Branch:** `plan/review-proposals/5-add-task-shortcut`
- **What it does:** opening the app with `?action=add-task` (the "Add Task" shortcut) goes to the Tasks
  page and opens the empty new-task form, ready to type.
- **Rules decided:**
  - signed out: sign-in comes first as usual, then the form opens (if keeping the action through
    sign-in isn't simple, opening Tasks without the form is acceptable; note it in the log);
  - `?action=add-task` is removed from the address once handled, so a reload or going back doesn't
    open the form again;
  - no page-change train for this jump (it isn't a page change the person made);
  - any other or unknown `action` is ignored (Home opens as now).
- **Done when:**
  - [ ] opening `/?action=add-task` while signed in shows the Tasks page with the new-task form open
  - [ ] the address no longer has `?action=add-task` afterwards; reloading shows Tasks without the form
  - [ ] opening `/` and `/?action=something-else` behave as before
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** on an Android phone with the app installed, long-press the icon → Add Task.
  (On a computer: open `/?action=add-task` in the browser.)
- **Needs:** nothing (the shortcut is already in public/manifest.json)
- **Depends on:** nothing

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
