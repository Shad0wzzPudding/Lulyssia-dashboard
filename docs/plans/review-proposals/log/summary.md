# Build summary: review-proposals

Built on 22 Oct 2026 against `main` at `d968f93` (only the plan itself had changed since the plan's
`2d01ff1`, so every item was built as written). All 11 items are **Built**. Each item's log, with how
every "Done when" line was checked, is in this folder.

## Items

| # | Item | Status | Branch | Based on |
| --- | --- | --- | --- | --- |
| 1 | Drag handle on unpinned interest cards | Built | `plan/review-proposals/1-interest-drag-icon` | main |
| 2 | About page 5px too wide on 320px phones | Built | `plan/review-proposals/2-about-narrow-phones` | main |
| 3 | Page-change train and "reduce motion" | Built | `plan/review-proposals/3-reduce-motion-train` | main |
| 4 | Double-click on "Undo Clear" opens "Clear" again | Built | `plan/review-proposals/4-clear-after-undo` | main |
| 5 | "Add Task" shortcut | Built | `plan/review-proposals/5-add-task-shortcut` | main |
| 6 | Installed app's colours | Built | `plan/review-proposals/6-app-colours` | main |
| 7 | Two sort choices that do nothing | Built | `plan/review-proposals/7-remove-useless-sorts` | main |
| 8 | Daily task edit open over midnight | Built | `plan/review-proposals/8-daily-edit-over-midnight` | main |
| 9 | A failed save loses what was typed | Built | `plan/review-proposals/9-keep-form-on-failed-save` | main |
| 10 | Tasks page slows down with many tasks | Built | `plan/review-proposals/10-tasks-page-speed` | item 9's branch |
| 11 | Deadline before the start | Built | `plan/review-proposals/11-deadline-before-start` | item 9's branch |

Items 10 and 11 are built on item 9's branch: the plan asked them to keep item 9's form changes (10)
and to refuse before "Saving…" (11), and all three change the same form code.

## Merge order

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → this summary branch last.

Items 1–8 can go in any order among themselves; 9 must come before 10 and 11. All of this was
tried by merging every branch into a local copy of `main` in this order: after the merges below, the
result passes typecheck, lint and build, and the browser checks for items 4, 5, 8, 9 and 11 were
run again on it and passed.

### Two kinds of merge conflict to expect
- **roadmap.md** (when merging 3, 5 and 6, and possibly others depending on order): each branch ticks
  its own proposal in roadmap.md, and several of those lines sit next to each other. Resolve by
  keeping, for each line, the version that starts with `- [x]` (the ticked one). Nothing else in the
  file differs.
- **src/components/dashboard/DailyTasksSection.tsx** (when merging 9 after 8): both change the
  imports at the top and add code near the same place. Resolve like this:
  1. the import lines at the top become:
     ```ts
     import { useEffect, useRef, useState } from 'react';
     import { format } from 'date-fns';
     import { DailyTask, FormSaveCallbacks, FormSaveMarker } from '@/lib/types';
     import { toast } from '@/lib/toast';
     ```
  2. keep both added blocks (item 9's `adding` / `savingEdit` / `editRun` / `closeEdit` block first,
     then item 8's `useEffect`);
  3. in item 8's `useEffect`, change `setEditing(null);` to `closeEdit();` (so a save started in that
     window can't leave the next edit window stuck on "Saving…").
  After that, 10 and 11 merge without conflicts.

## Deploy checklist

Nothing to apply or deploy: no item needs a migration or a function deploy. The site changes go out
with the next Vercel deploy after merging. (Item 6 changes `public/manifest.json`; an installed app
may need reinstalling, or time to update, before the new colours show.)

## Assumptions and open questions (one at a time)

1. **Item 2:** the plan offered less tilt or less side margin. Measuring showed the overflow comes
   from the text beside the portrait, not the tilt, so below 360px the card's side padding goes from
   20px to 12px; the tilt is unchanged.
2. **Item 3:** Settings' note reads "Your device asks for less motion, so page transitions are off."
3. **Item 4:** Clear stays hidden for 1 second, then fades in over 0.3s; while hidden it is also out
   of reach for the keyboard and screen readers.
4. **Item 5:** the plan expected a reload after the shortcut to show **Tasks**; it shows **Home**,
   because the app has never remembered the open page across a reload (adding that would be a new
   feature). The form doesn't reopen either way.
5. **Item 5:** the shortcut request is kept through sign-in for the current tab only; no sound plays
   when the form opens this way; if the dashboard fails to load, the form isn't opened later.
6. **Item 6:** the exact conversions are `#080b0c` and `#3aafcf` (the plan's "about" values were
   `#080c0e` and `#3aadd0`).
7. **Item 8:** the window closes only when the task is gone **and** the list is for another day; a task
   deleted elsewhere during the same day leaves the window as before.
8. **Item 9:** the daily quick add's "+" button: its failure message says "press Add again", and while
   saving it is disabled (its screen-reader name reads "Saving…").
9. **Item 9:** a failure after the form was closed shows the same message (still "press Create
   again").
10. **Item 10:** "Show more (N left)" is a full-width outline button under the section's cards.
11. **Item 10 (question):** select mode's **"All"** still picks every task matching the search and
    tag filter, including ones not shown yet behind "Show more" (the delete question shows the
    count). Should "All" pick only the shown ones?
12. **Item 11:** the message is red text under the deadline field; the browser's own "must be … or
    later" bubble is replaced by it. The Events form uses the same wording ("deadline").

## Owner checks by eye

- **1:** the Interests page in "User sort" and in another sort (no grab icon on the cards; the list's
  own handle in "User sort").
- **2:** the About page on a narrow phone (or a 320px browser window).
- **3:** a page change with the device's reduce-motion setting on and off, and the note in Settings →
  Animating menu.
- **4:** Clear Completed → Undo on Tasks and Clear Past → Undo on Events, including a quick double
  click on Undo; the Clear button's fade-in.
- **5:** on an Android phone with the app installed, long-press the icon → Add Task (on a computer:
  open `/?action=add-task`).
- **6:** open the installed app on Android (the dark launch screen and cyan status bar).
- **7:** the sort menus on Tasks and Interests.
- **8:** the message wording (seeing it for real needs midnight).
- **9:** turn Wi-Fi off on the phone, try to save a task, turn it back on and press Create again; the
  "Saving…" button.
- **10:** the Tasks page with your real tasks (search, tick, "Show more" if a section has over 50).
- **11:** open a task, move its start past its deadline and press Update; the red message.

## Stopped early?

No: every item is built.
