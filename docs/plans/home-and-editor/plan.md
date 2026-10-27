# Plan: Home and description editor

**Status:** Draft <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `9abde7e` (27 Oct 2026)
**Decided with the owner on:** 27 Oct 2026 (in progress)

## Goal

Make Home and the description editor easier to use: a task or event that starts and ends on the same day
shows once instead of twice, tasks and events can be edited straight from Home, their pictures show in
Home's details, and whole lines of a description can be indented with Tab, Space or a Tab button.

Each item starts as "Not decided yet"; its decisions are written in as soon as the owner makes them, so
the plan can be picked up again at the first undecided item.

## Not in this plan

Anything beyond the six ideas below. New ideas that come up go to the roadmap's backlog.

## Items

Build them in this order. Each one is its own branch and can be merged on its own unless it says
"Depends on".

### 1. One entry for a task or event that starts and ends on the same day
- **Owner's idea:** ถ้า Task หรือ event เริ่ม และจบในวันเดียวกัน ให้ Merge ตอนแสดงในปฎิทิน และ Today
  event, task เลย (if a task or event starts and ends on the same day, merge it when shown in the calendar
  and in Today's events and tasks).
- **Found while planning:** such an item already shows only once in the calendar's day list and in the
  Today lists, but with its two times side by side (two time chips, two badges "Start"/"End" or
  "Starting"/"Deadline", or "Starts: … · Due: …").
- **Decision:** show one time range instead of the two times; keep the green/red side stripe.
- **Branch:** `plan/home-and-editor/1-same-day-range`
- **What it does:** a task or event whose start and end fall on the same day shows its time as one range,
  "09:00 – 13:00", in four places on Home: the calendar's day list, the calendar's details window, Today's
  Tasks and Today's Events.
- **Rules decided:**
  - calendar day list: the two time chips become one range chip, and the "Start" and "End"/"Due"
    badges for that item are dropped (the type badge "task"/"event" stays); the half-green, half-red
    side stripe stays exactly as now, as the sign that it starts and ends that day;
  - details window: the "Start:" and "End:"/"Due:" rows become one row "Time: 09:00 – 13:00";
  - Today's Tasks: the "Starting" and "Deadline" badges and "Starts: … · Due: …" become the range;
  - Today's Events: "Starts: …" and "Ends: …" become the range;
  - only items that start and end on the same day change; one that only starts or only ends that day
    keeps today's look; this also holds for days other than today in the calendar;
  - the range chip's colour follows preview option B (cyan); the exact style may use the app's
    existing chip classes.
- **Preview:** `previews/1-same-day.html`, option **B**, plus the side stripe from "Now". **Intent only:**
  use the app's real components and sizes.
- **Done when:**
  - [ ] a same-day task and a same-day event show "HH:mm – HH:mm" once in each of the four places, with
    no Start/End or Starting/Deadline badges
  - [ ] the calendar's day list keeps the half-green, half-red side stripe for them
  - [ ] an item that only starts or only ends that day looks as before in all four places
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** Home with a same-day task and event, today and on another calendar day.
- **Needs:** nothing
- **Depends on:** nothing

### 2. Tab on selected lines in the description editor
- **Owner's idea:** select lines and press Tab to indent the selected lines.
- **Decision:** Not decided yet

### 3. Space on selected lines in the description editor
- **Owner's idea:** select lines and press Space to add a space at the start of the selected lines.
- **Decision:** Not decided yet

### 4. A Tab button in the editor's toolbar
- **Owner's idea:** a Tab format button that indents the line; 1 tab = 6 spaces.
- **Decision:** Not decided yet

### 5. Edit tasks and events from Home
- **Owner's idea:** a pencil icon right after a task's or event's name on Home opens its edit form.
- **Decision:** Not decided yet

### 6. Pictures in Home's details
- **Owner's idea:** when a task or event is clicked on Home, its pictures show with its information.
- **Decision:** Not decided yet

## Questions answered while planning

(Filled in as we go.)

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

Filled in as items are decided.
