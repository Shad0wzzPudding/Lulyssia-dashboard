# 2. Marked dates show only the round circle; no more hiding a date

**Status:** Built
**Branch:** `plan/home-calendar/2-circle-only` (based on `main`)

## Done when
- [x] a marked date has a transparent square and the round circle, in dark and light mode — local browser with test data, computed styles of the 5th and 10th (marked) and the 12th (not marked) with the `dark` class on and off: background `rgba(0,0,0,0)` and no gradient on all; marked ones have the `::after` circle (radius 9999px; `p5-300` at 30% in light, `p5-500` at 30% in dark) and weight 600; the 12th has no circle
- [x] a date saved as hidden before shows its circle, and the key is gone afterwards — `hiddenCalendarDates` set to `["2026-11-05"]` before loading: the 5th shows its circle, and the key reads `null` after load
- [x] no eye button in the date panel; nothing else in the header moved — the header holds no button and nothing titled "Show/Hide highlight"; the date and year block is unchanged (screenshot checked)
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on HomePage.tsx, `npm run build`

## Owner checks by eye
- The circles on a few marked dates, next to today's ring and the picked date.

## Assumptions
- The saved list is removed each time Home opens (removing a key that's already gone does nothing),
  rather than remembering that it was removed.
- A marked date keeps its text colour (`text-p5-900` / `dark:text-p5-100`) with the bold number: the
  plan lists only the square background to remove.

## Needs
nothing

## Notes
- `main` moved from `4b2f960` to `57d208d` since the plan was written: only the plan's own files
  changed.
- The picked date keeps the calendar's own filled look (unchanged), as the plan says.
