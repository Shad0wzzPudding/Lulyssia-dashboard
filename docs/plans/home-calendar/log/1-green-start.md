# 1. An event's start line is green

**Status:** Built
**Branch:** `plan/home-calendar/1-green-start` (based on `main`)

## Done when
- [x] an event whose start is on the picked date (and its end isn't) shows a green line, the same green as a task's start (`bg-green-500`) — local browser with test data (clock at 3 Nov 10:20 Thai time), 5 Nov picked: "E start" (5 Nov 10:00 – 6 Nov) has `bg-green-500`, like "T start"
- [x] tasks, ends and the split line are unchanged — same check: "T due" and "E end" red (`bg-red-500`), "T both" and "E both" the green-over-red split line
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on HomePage.tsx, `npm run build`

## Owner checks by eye
- The green line next to an event's green start time.

## Assumptions
none

## Needs
nothing

## Notes
- `main` moved from `4b2f960` to `57d208d` since the plan was written: only the plan's own files
  changed.
