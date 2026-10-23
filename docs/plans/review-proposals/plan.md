# Plan: Cloud review proposals

**Status:** Reviewed <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `2d01ff1` (16 Oct 2026)
**Decided with the owner on:** 16 and 22 Oct 2026
**Reviewed with the owner on:** 23 Oct 2026 (see "After the build" at the end)

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
- **Decision:** Use the app's own colours: dark launch screen, cyan status bar.
- **Branch:** `plan/review-proposals/6-app-colours`
- **What it does:** the installed app opens on a near-black screen instead of white, and Android's
  status bar is the app's cyan instead of blue.
- **Rules decided:** `background_color` = the app's page background and `theme_color` = the app's
  cyan, converted from `--background` and `--primary` in src/index.css (about `#080c0e` and `#3aadd0`;
  use the exact conversion). Only public/manifest.json changes.
- **Done when:**
  - [ ] public/manifest.json has the two new colours and is still valid JSON
  - [ ] the hex values match `--background` and `--primary` in src/index.css
  - [ ] build passes
- **Owner checks by eye:** open the installed app on Android (may need reinstalling the app, or
  waiting for it to update, before the new colours show).
- **Needs:** nothing
- **Depends on:** nothing

### 7. Two sort choices that do nothing
- **Problem:** "Completed last" on Tasks and "Pinned first" on Interests: those items already have their
  own sections, so the list just keeps its loaded order.
- **Decision:** Remove both choices.
- **Branch:** `plan/review-proposals/7-remove-useless-sorts`
- **What it does:** the Tasks sort menu no longer offers "Completed last", and the Interests sort menu
  no longer offers "Pinned first".
- **Rules decided:** a sort is saved per person in `user_preferences` (src/hooks/useSortPreference.ts).
  If the saved sort is one of the removed two (or any value that isn't a known option), the page uses
  the default sort ("Deadline (soonest)", `deadline_asc`) instead of crashing or showing a blank menu.
  The saved value may be left as is; it's simply ignored. The `showPinned` and `showCompleted`
  options of SortAndFilterBar and the two cases in src/lib/sortAndFilter.ts go if nothing else uses them.
- **Done when:**
  - [ ] neither choice appears in any sort menu
  - [ ] with `pinned_first` or `completed_last` saved as the sort, the page opens sorted by deadline and
    the menu shows "Deadline (soonest)"
  - [ ] the other sorts work as before on Tasks, Events and Interests
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** the sort menus on Tasks and Interests.
- **Needs:** nothing
- **Depends on:** nothing

### 8. Daily task edit window open over midnight
- **Problem:** Update then saves to yesterday's copy (shows "updated" but the change isn't on today's
  list or tomorrow's routine).
- **Decision:** Close the edit window with a short note; save nothing to yesterday.
- **Branch:** `plan/review-proposals/8-daily-edit-over-midnight`
- **What it does:** when the new day's daily list loads while a daily task's edit window is open, and
  the task being edited isn't on the new list (it was yesterday's copy), the window closes and a message
  says: "A new day started, so this edit wasn't saved. Open today's task to edit it." Nothing is saved.
- **Rules decided:** only for the daily tasks' edit window (src/components/dashboard/DailyTasksSection.tsx).
  If the person presses Update during the moment the new list is still loading, nothing is saved either
  (it's already locked then). The message uses the app's usual pop-up message style.
- **Done when:**
  - [ ] with the edit window open, switching the day (simulate by changing the list's day / query key)
    closes it with the message, and no update is sent for yesterday's task
  - [ ] editing during the same day works as before
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** hard to see for real (needs midnight); reading the message wording is enough.
- **Needs:** nothing
- **Depends on:** nothing

### 9. A failed save loses what was typed
- **Problem:** the add/edit form closes as soon as Create or Update is pressed; when the save fails
  (dropped connection, server error) the text and choices are gone. The daily list's quick add clears
  its box the same way.
- **Decision:** Forms stay open until the save succeeds; on failure everything typed stays.
- **Branch:** `plan/review-proposals/9-keep-form-on-failed-save`
- **What it does:** pressing Create or Update shows "Saving…" on that button (disabled) until the
  database answers. Success: the form closes and the usual message shows, as now. Failure: the form
  stays open with every field as it was, and the message says "Couldn't save. Check your connection and
  press Create again." (or "Update"). The daily list's quick-add box keeps its text (and time) until the
  task is saved, and keeps it if saving fails.
- **Rules decided:**
  - applies to the add/edit forms of Tasks, Events and Interests (including copies made through the
    form) and to the daily tasks' quick add and edit window;
  - Cancel and closing the form still work while saving; the save then finishes on its own, and a
    failure only shows the message (closing means letting go of the text);
  - the existing "Uploading file…" wait stays as it is, before "Saving…";
  - sounds stay as now (played when the button is pressed);
  - a double press can't save twice (the button is disabled while saving).
- **Done when:**
  - [ ] with the save request made to fail (offline, or a stubbed error), the form stays open with all
    fields kept and the new message, on Tasks, Events and Interests, for both create and edit
  - [ ] with it succeeding, the form closes and behaves as before
  - [ ] the button shows "Saving…" and can't be pressed twice while the request is out
  - [ ] the daily quick add keeps its text on failure and clears it on success
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** turn Wi-Fi off on the phone, try to save a task, turn it back on and press
  Create again.
- **Needs:** nothing
- **Depends on:** nothing

### 10. Tasks page slows down with many tasks
- **Problem:** every card is redrawn on each search keystroke or tick: about 0.3s per tick at 60 tasks
  on a mid-range phone, 2s at 1,000 tasks.
- **Decision:** Code-only speed-up, plus long sections show 50 tasks at a time with "Show more".
- **Branch:** `plan/review-proposals/10-tasks-page-speed`
- **What it does:**
  1. behind the scenes: a card that didn't change isn't redrawn when another task is ticked or edited,
     and the search results update just after typing instead of holding up each letter;
  2. the In Progress, Overdue and Upcoming sections on the Tasks page show their first 50 tasks, then a
     "Show more (N left)" button at the bottom that adds the next 50.
- **Rules decided:**
  - Completed Tasks keeps its existing "+N more" cover; Daily Tasks is unchanged;
  - the shown count goes back to 50 when the search, tag filter or sort changes;
  - in "User sort", only shown tasks can be dragged; dragging stays within the shown ones;
  - Tasks page only (Events and Interests can follow later if needed);
  - nothing else looks different; with 50 or fewer tasks in a section there's no button.
- **Done when:**
  - [ ] measured on the production build (`npm run build` + `vite preview`) with test data of 60, 200 and
    1,000 tasks and the processor slowed 4× in dev tools: time per letter typed in search and per tick,
    before and after, written in the log (before: about 65–250ms / 300ms at 60, 150–480ms / 470ms at
    200, 0.8–2s / 2s at 1,000); after should be clearly lower at every size, and a tick at 200 tasks
    under about 100ms
  - [ ] a section with more than 50 tasks shows 50 and "Show more (N left)"; pressing it shows 50 more
  - [ ] search, filter and sort still give the same results as before
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** the Tasks page with your real tasks (search, tick, Show more if a section
  has over 50).
- **Needs:** nothing
- **Depends on:** nothing (if item 9 is built first, keep its form changes when touching TasksPage.tsx)

### 11. Deadline before the start
- **Problem:** the task and event forms accept a deadline (or end) before the start, e.g. after moving a
  task's start past a hand-set deadline, so it turns Overdue (and sends a LINE nudge) before it starts.
- **Decision:** Refuse to save a deadline (or end) before the start.
- **Branch:** `plan/review-proposals/11-deadline-before-start`
- **What it does:** in the task and event forms, pressing Create or Update with the deadline before the
  start shows "The deadline is before the start" under the deadline field and doesn't save. The deadline
  picker's earliest choice is the start time when a start is set.
- **Rules decided:**
  - a deadline equal to the start is allowed; only strictly earlier is refused;
  - if either date is empty, there's nothing to compare and saving works as now;
  - the automatic "start + 5 hours" deadline keeps working as now;
  - an existing item that already has a deadline before its start opens normally, and only needs fixing
    when it's saved from the form;
  - the message goes away as soon as the dates are fixed;
  - Interests (one date) and daily tasks (a time only) are not affected.
- **Done when:**
  - [ ] a task and an event with the deadline before the start can't be saved, and show the message
  - [ ] equal dates, or a missing start or deadline, save as before
  - [ ] after fixing the dates, saving works without reopening the form
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** open a task, move its start past its deadline and press Update.
- **Needs:** nothing
- **Depends on:** nothing (if item 9 is built first, the refusal happens before "Saving…")

## Questions answered while planning

- **Q:** Where are these from? **A:** The cloud review of 15 Oct 2026, roadmap.md "Cloud review
  (15 Oct 2026)", items marked "Needs decision" (with the evidence for each).
- **Q:** What happens to those roadmap lines? **A:** Each item's branch ticks its roadmap line and
  adds "Done: <what changed> (plan review-proposals, item N)", like the other roadmap entries.
- **Q:** Previews? **A:** None were needed; every item is described in words above.

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

Nothing to apply or deploy: no item needs a migration or a function deploy. The site changes go out
with the next Vercel deploy after merging.

- [x] Merge the item branches in order (1 → 11; 9 before 10 and 11), then `plan/review-proposals/summary`
  last. Done on `review/review-proposals-merged` (23 Oct), with the review's fixes on top: merge that
  branch into `main`.
- [ ] After merging: nothing to run on the database or the functions.
- [ ] After the next Vercel deploy: the installed app picks up the new manifest colours (item 6) when it
  updates or is reinstalled.

## After the build

Reviewed on 23 Oct 2026 on the branch `review/review-proposals-merged` (every build branch merged
in order, plus the commits below). Typecheck, lint and build pass; the owner's checks 1–11 were
gone through in the browser on the test account (Test-dummy).

**Found in the code review and fixed**
- After the "Add Task" shortcut, every later visit to Tasks opened the new-task form again.

**Decided with the owner (each is its own commit)**
- Item 9: an offline save is refused right away ("Couldn't save. Check your connection and press …
  again.", form kept) instead of waiting on "Saving…" and going through later. Ticks, pins and
  drags still wait for the connection. A failure after the form was closed keeps the same message.
- Item 3: with "reduce motion" on, Page transitions and flashing start off but are no longer locked;
  the choice made then is saved separately. "Reduce flashing" became "Enable flashing" (on = flashes
  play). A "!" on the Animating menu title, the drawer tab and the drawer's Settings slab
  ("Animations are off on this device") stays until "Tap to dismiss" is pressed.
- Item 4: "Undo Clear" (Tasks and Events) needs a 0.7s long press ("Hold to undo" after a quick
  click), and "Clear" stays out of reach for 2 seconds after Undo (was 1).
- Item 8: a daily task edit open over midnight moves to today's copy (same title) with what was
  typed kept unsaved, instead of closing; with no copy it closes as built.
- Item 10: sections show 25 at a time (was 50), on Events too (Today, In Progress, Upcoming, Past
  once unfolded); select-mode "All" still picks hidden items and the delete question says how many
  are behind "Show more"; the "Show more" bar is cyan.
- Item 11: events call their second date "End" (form, cards, Home); the messages read "The deadline
  is before the start. Pick a later deadline or an earlier start." and "The end is before the
  start. Pick a later end or an earlier start."
- About card text: "…needs to be linked with your LINE first, so please do that on the Settings page."
- Accepted as built: items 1, 2, 5 (reload shows Home, no sound, waits through sign-in), 6, 7, and
  the quick add's "press Add again".

**Still to see after the next deploy**
- Item 5 on Android: long-press the installed app's icon → Add Task.
- Item 6 on Android: the installed app's dark launch screen and cyan status bar (may need a reinstall).
- Item 8 for real: an edit left open over midnight (only reachable at a day change).
- The "reduce motion off" side of item 3 wasn't tried (needs the device setting changed).

**For a later plan**
- Deleting many selected items sends one request each (60 tasks took several seconds to disappear).
