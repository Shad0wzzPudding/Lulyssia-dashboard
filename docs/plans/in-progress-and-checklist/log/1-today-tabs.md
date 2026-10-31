# 1. Today sections on the Tasks and Events pages, with tabs

**Status:** Built
**Branch:** `plan/in-progress-and-checklist/1-today-tabs` (based on `main`)

## Done when
- [x] with the preview's sample tasks and events (10:00 on a day), the Tasks page's Today's Tasks, In Progress and Upcoming hold the same tasks as the preview's option X, and the Events page's Today's Events, In Progress and Upcoming the same events — browser check (local dev server, test data, a fake clock at 10:00 Thai time on Sat 31 Oct, nothing reaches the live project): Today's Tasks = Essay draft, Buy a birthday gift, Read chapter 4, Lab report, Call the dentist; In Progress = Science project; Upcoming = Piano practice (plus an extra task starting tomorrow); Today's Events = Hackathon, Book fair, Team meeting (plus an extra event that ended at 08:00); In Progress = Art exhibition; Upcoming = Movie night; Past = an old event
- [x] the tabs show the preview's counts and items (a same-day item under both Start today and End today), and a task due earlier today is in Overdue, not Today's Tasks — browser check: Tasks: All 5, Start today 3 (gift, lab report, dentist), End today 3 (essay, gift, chapter 4); Events: All 4, Start today 2, End today 3 (Team meeting under both); a task due at 09:00 is in Overdue at 10:00
- [x] the Tasks page shows five tiles, Today first, and fits a 360px phone without sideways scroll — browser check: "5 Today, 1 In progress, 2 Upcoming, 1 Overdue, 1 Completed"; at 360px the page is 360px wide and the tiles show in two rows (3 + 2) with whole labels
- [x] search, tag filter, sort, select mode ("All" picks only what's shown) and "Show more" work in Today's Tasks as in the other sections — browser check: `report, !lab` empties Today's Tasks as expected; in select mode with the End today tab, "All" picked 8 of 10 tasks (not the 2 the tab hides); 30 tasks for today show 25 and "Show more (5 left)", then all 30; sort and the tag filter run on the same list as before (the sections are filtered from it)
- [x] across midnight in Thai time, tomorrow's tasks move into Today's Tasks without a reload — browser check: the fake clock from 23:59 to 00:01: the task starting 1 Nov moved into Today's Tasks, today's unfinished ones became Overdue, Lab report moved to In Progress
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

Also checked: a day with nothing shows "No tasks for today"; a tab with nothing says "Nothing starts today" / "Nothing ends today".

## Owner checks by eye
The Tasks and Events pages with real data on a computer and a phone: the Today sections, the tabs, the five count tiles.

## Assumptions
- On phones the five tiles show as two rows (3 + 2): in one row their labels were cut short ("In pro…") at 360px. From tablet width up they're one row.
- A tab that hides some of today's items hides them like a search does: select mode's "All" doesn't pick them, and they're unpicked (as a search unpicks what it hides).
- The tabs use the app's normal small buttons (filled for the chosen tab), each with its count.
- An event that ended earlier today isn't a "past" event until the day ends, so "Clear Past" leaves it alone until then (it's shown in Today's Events).
- A task that started on an earlier day without a deadline stays in Upcoming, as now (it has nothing ending today and isn't "in progress" without a deadline).

## Needs
nothing

## Notes
- Home is unchanged.
- The plan itself is on branch `plan-draft/in-progress-and-checklist` (not on `main` yet); `main` hadn't changed since the plan's `3359d35`.
