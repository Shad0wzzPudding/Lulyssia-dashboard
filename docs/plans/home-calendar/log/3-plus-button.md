# 3. A plus button makes a new task or event on the picked date

**Status:** Built
**Branch:** `plan/home-calendar/3-plus-button` (based on item 2's branch, `plan/home-calendar/2-circle-only`)

## Done when
- [x] the plus shows whenever a date is picked; the menu has exactly "New task" and "New event" — local browser with test data: no plus before a date is picked, one after; menu items `["New task", "New event"]`
- [x] New task on a future date opens the task form with Deadline = that date 09:00 and the rest empty; New event the same with Start — 7 Nov picked (clock 3 Nov 10:20): task form's only filled field is the deadline `2026-11-07T09:00`; event form's only filled field is the start `2026-11-07T09:00`
- [x] on today, the time is the next full hour (and 23:59 after 23:00) — browser: 10:20 → `2026-11-03T11:00`, 23:10 → `2026-11-03T23:59`; a script on `presetTime` with 8 cases (10:00 → 11:00, 22:59 → 23:00, 00:00 → 01:00, past and future days → 09:00) all pass
- [ ] saving a task and an event made this way (named "ZZ …" on the Test-dummy account) puts them on that date in the calendar and date panel; delete them afterwards — not verified on the Test-dummy account: this build doesn't write to the live project. Checked instead with the local test backend: "ZZ task on 7th" saved with deadline 7 Nov 09:00 and "ZZ event on 7th" with start 7 Nov 09:00 (Thai time), both listed in the 7th's date panel. Worth doing on Test-dummy after merging.
- [x] "Add Task" on Tasks and "Add Event" on Events still open empty forms — browser: both forms have no filled field
- [x] keyboard: Tab to the plus, Enter opens the menu, arrows move, Enter picks, Escape closes — browser: Enter opens it with "New task" focused, ArrowDown moves to "New event", Escape closes it with the focus back on the plus; Enter, ArrowDown, Enter opens the event form (focus inside the form)
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

## Owner checks by eye
- The plus and its menu (look, place, on a phone too).
- The sound when the form opens: the same "add" sound the Add Task / Add Event buttons play.

## Assumptions
- The sound: picking "New task" or "New event" plays the add sound, like the Add Task / Add Event
  buttons (the form itself plays none when it opens).
- The form opens once the menu has closed (so the menu doesn't take the focus back from the form);
  closing the menu without a choice puts the focus back on the plus.
- The menu opens below the plus, lined up with its right edge.

## Needs
nothing

## Notes
- New file `src/lib/presetTime.ts` holds the date-and-time rule.
- `openNew()` with no argument works as before (Tasks, Events and the Add Task shortcut use it).
- Merge after item 2: this branch contains item 2's commits.
