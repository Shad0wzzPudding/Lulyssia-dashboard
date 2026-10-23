# 10. Tasks page slows down with many tasks

**Status:** Built
**Branch:** `plan/review-proposals/10-tasks-page-speed` (based on item 9's branch, `plan/review-proposals/9-keep-form-on-failed-save`)

## Done when
- [x] measured on the production build with 60, 200 and 1,000 tasks and the processor slowed 4×: time per letter typed in search and per tick, before and after — see the table below; clearly lower at every size, and a tick at 200 tasks is about 65ms (target: under about 100ms)
- [x] a section with more than 50 tasks shows 50 and "Show more (N left)"; pressing it shows 50 more — browser check with 132 upcoming tasks: 50 shown and "Show more (82 left)"; then 100 and "Show more (32 left)"; then all 132 and no button. Changing the search or the sort went back to 50
- [x] search, filter and sort still give the same results as before — the before and after builds listed every section's titles (all "Show more" opened) for 5 sorts (Newest first, Deadline (soonest), Title Z–A, By tag, User sort), each with no search, a search on the title and a search on a bold word in the description: identical output (15,797 characters each). The tag filter's code is unchanged
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint src/components/dashboard/TasksPage.tsx`, `npm run build`

### Measurements
Production build (`vite build` + `vite preview`), phone-sized window (390×844), Chromium with the processor slowed 4×, test data with a third of the tasks completed. "Per letter": typing "Task" into search, time from the key press to the next frame. "Tick": time from the click on a task's tick (run inside the page, so the test tool's own searching isn't counted) to the next frame. Three ticks each.

| Tasks | Per letter, before | Per letter, after | Tick, before | Tick, after | Page elements, before → after |
| --- | --- | --- | --- | --- | --- |
| 60 | 166–325ms | 62–88ms | 71–103ms | 30–52ms | 2,245 → 2,245 |
| 200 | 279–833ms | 86–132ms | 125–159ms | 64–66ms | 6,264 → 4,377 |
| 1,000 | 0.76–3.7s | 121–156ms | 476–522ms | 55–64ms | 29,290 → 4,783 |

The list itself now follows just after the typing: after the last letter it finished updating in about 0.2s (60 tasks), 0.4s (200) and 0.5s (1,000), about the same as before, but the letters no longer wait for it.

The plan's "before" figures (from the review) timed ticks including the test tool's own search for the button, which on a big page is most of the time; these numbers time only the app, before and after alike.

## Owner checks by eye
The Tasks page with your real tasks (search, tick, Show more if a section has over 50).

## Assumptions
- "Show more" is a full-width outline button under the section's cards, reading "Show more (N left)".
- **Select mode's "All"** still picks every task that matches the search and tag filter, including ones not shown yet behind "Show more" (the delete question shows how many). The plan doesn't cover it; making "All" pick only the shown ones would be a small change if wanted.

## Needs
nothing

## Notes
- Built on item 9's branch because both change TasksPage.tsx (the plan says to keep item 9's form changes); merge item 9 first.
- In "User sort", dragging works among the shown tasks; the hidden ones keep their places (the existing reorder already handles a partial list, as with a search). Checked in the browser: the drag reordered the shown cards.
- Each task card is now its own component that skips redrawing when its task, its section badge and select-mode state are unchanged; the card's buttons go through one unchanging set of actions so this works.
