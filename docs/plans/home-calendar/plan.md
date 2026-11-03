# Plan: home-calendar

**Status:** Built <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `4b2f960` (2026-11-03)
**Decided with the owner on:** 2026-11-03

## Goal

Home's Calendar Overview gets simpler and more useful: an event's start reads green like a task's,
marked dates show only their round circle, and the eye ("Hide/Show highlight") button becomes a plus
that makes a new task or event on the picked date.

## Not in this plan

- Any other page's calendar or lists: only Home's Calendar Overview changes.
- The Today Events card, Upcoming Events and the rest of Home.
- Changing the task and event forms themselves (fields, wording, saving). They only gain a way to
  open with one date already filled in.

## Items

Build them in this order. Each one is its own branch and can be merged on its own unless it says
"Depends on".

### 1. An event's start line is green

- **Branch:** `plan/home-calendar/1-green-start`
- **What it does:** in the date panel (right of the calendar), an item's thin line at its left edge
  is green when the item starts on the picked date, for events as well as tasks. Today an event's
  start shows the blue/cyan line (`bg-p5-500` in `HomePage.tsx`, the only place it's used).
- **Rules decided:**
  - start only on that date: green, for tasks and events;
  - end/deadline only: red, as now;
  - both on that date: the green-over-red split line, as now.
- **Preview:** `previews/plus-button.html` (the items in the date panel). Intent only.
- **Done when:**
  - [ ] an event whose start is on the picked date (and its end isn't) shows a green line, the same
        green as a task's start (`bg-green-500`);
  - [ ] tasks, ends and the split line are unchanged;
  - [ ] typecheck, lint and build pass.
- **Owner checks by eye:** the green line next to an event's green start time.
- **Needs:** nothing.
- **Depends on:** nothing.

### 2. Marked dates show only the round circle; no more hiding a date

- **Branch:** `plan/home-calendar/2-circle-only`
- **What it does:** on Home's calendar, a date with a task or event shows only the round circle
  behind its number. The square block behind it (the `marked` class's background gradient) is gone.
  The eye button in the date panel's header, which hid or showed a date's mark, is removed together
  with what it did: dates hidden before show their circle again.
- **Rules decided:**
  - keep: the round circle (the `after:` overlay), the bold number, the pointer and the small grow on
    hover; today's ring; the picked date's look;
  - remove: the square background (`bg-gradient-to-br from-p5-200 …`), the `neutralized` modifier,
    the `hiddenDates` state, `toggleDateVisibility`, `isDateHidden`, the Eye/EyeOff button and their
    imports if no longer used;
  - the saved list in the browser (`localStorage` key `hiddenCalendarDates`) is removed once, so it
    doesn't linger (wrapped in try/catch like the other storage calls);
  - the text "Click on highlighted dates to see details" and "Highlighted dates have scheduled
    activities" stays (the circles are still the highlight).
- **Preview:** `previews/plus-button.html` (the calendar). Intent only: the real calendar's sizes.
- **Done when:**
  - [ ] a marked date has a transparent square and the round circle (checked in the DOM / computed
        style), in dark and light mode;
  - [ ] a date saved as hidden before (put `["<date>"]` in `hiddenCalendarDates` before loading)
        shows its circle, and the key is gone afterwards;
  - [ ] no eye button in the date panel; nothing else in the header moved;
  - [ ] typecheck, lint and build pass.
- **Owner checks by eye:** the circles on a few marked dates, next to today's ring and the picked date.
- **Needs:** nothing.
- **Depends on:** nothing.

### 3. A plus button makes a new task or event on the picked date

- **Branch:** `plan/home-calendar/3-plus-button`
- **What it does:** where the eye button was (right of the date in the date panel's header), a plus
  icon button. It opens a small menu with "New task" and "New event". Picking one opens that form,
  empty except for the picked date:
  - New task: **Deadline** on the picked date;
  - New event: **Start** on the picked date.
- **Rules decided:**
  - one plus with a menu (not two buttons) — owner's choice A;
  - the time: if the picked date is today, the next full hour from now (10:20 → 11:00; at 23:xx, use
    23:59 so it stays on today); on any other date, 09:00. The device's clock, as the forms use;
  - nothing else is filled in; the user can change or clear the date before saving, and saving works
    exactly as the form's "Add Task" / "Add Event" does now (same sounds, same checks);
  - the menu is the app's `DropdownMenu` (`src/components/ui/dropdown-menu.tsx`): keyboard and
    Escape work, focus goes back to the plus when it closes without a choice;
  - the plus has an accessible name ("New task or event on this date") and a title tooltip;
  - the forms get a way to open with that one date, e.g. `openNew({ deadline })` for tasks and
    `openNew({ start_time })` for events, values in the form's `yyyy-MM-dd'T'HH:mm` format; the
    existing `openNew()` with no argument works as before.
- **Preview:** `previews/plus-button.html`, option A. Intent only: use the app's real button, menu
  and forms.
- **Done when:**
  - [ ] the plus shows whenever a date is picked; the menu has exactly "New task" and "New event";
  - [ ] New task on a future date opens the task form with Deadline = that date 09:00 and the rest
        empty; New event the same with Start;
  - [ ] on today, the time is the next full hour (and 23:59 after 23:00);
  - [ ] saving a task and an event made this way (named "ZZ …" on the Test-dummy account) puts them
        on that date in the calendar and date panel; delete them afterwards;
  - [ ] "Add Task" on Tasks and "Add Event" on Events still open empty forms;
  - [ ] keyboard: Tab to the plus, Enter opens the menu, arrows move, Enter picks, Escape closes;
  - [ ] typecheck, lint and build pass.
- **Owner checks by eye:** the plus and its menu (look, place, on a phone too); the sound when the
  form opens (whatever the form plays now).
- **Needs:** nothing.
- **Depends on:** item 2 (it takes the eye button's place; build on item 2's branch).

## Questions answered while planning

- **Q:** Item 3 ("remove the highlight the button applied, the block not the round one"): which part?
  **A:** Remove the square block behind marked dates and keep the round circle; the hide-a-date
  feature goes with the eye button, so dates hidden before show again (option A).
- **Q:** How does the plus offer a task or an event? **A:** One plus that opens a small menu, "New
  task" / "New event" (option A, not two buttons).
- **Q:** What does the new form start with? **A:** Task: Deadline on the picked date; event: Start on
  it. Time: next full hour if the date is today, otherwise 09:00 (option A).
- **Q:** Does the event's green line apply anywhere else? **A:** Only Home's date panel uses the blue
  start line, so only there.

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

Nothing to deploy or migrate: all three items are front-end only and go out with Vercel when merged.

- [x] Nothing to apply or deploy (checked at build, 3 Nov 2026). Merge order: item 1, item 3 (brings item 2), then `plan/home-calendar/summary`.

## Summary

`summary.html` — the whole build at a glance (now → after), published at https://claude.ai/artifact/Wz3bGR1d8tvLAiLKhsENPQ
