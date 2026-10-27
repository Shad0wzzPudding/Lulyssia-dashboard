# 1. One entry for a task or event that starts and ends on the same day

**Status:** Built
**Branch:** `plan/home-and-editor/1-same-day-range` (based on `main`)

## Done when
- [x] a same-day task and a same-day event show "HH:mm – HH:mm" once and the badge "Start and end today" in each of the four places, with no Start/End or Starting/Deadline badges — browser check (local dev server, test data, nothing reaches the live project): Today's Tasks "Same-day task · Start and end today · 09:00 – 23:00"; Today's Events "Same-day event · Start and end today · 09:00 – 13:00"; calendar day list "task · Start and end today · 09:00 – 13:00" (one chip); details window "Start and end today", "Time: 09:00 – 13:00", no Start/End rows
- [x] on another calendar day the badge reads "Start and end <d MMM>", e.g. "Start and end 3 Nov" — browser check: a task and an event on 3 Nov showed "Start and end 3 Nov" with their ranges
- [x] the calendar's day list keeps the half-green, half-red side stripe for them — browser check: both same-day items still have the green/red stripe
- [x] an item that only starts or only ends that day looks as before in all four places — browser check: the same test run on `main` and on this branch gave identical text and stripes for a task that only starts today, one only due today and an event running into tomorrow (Today lists, day list, details window)
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint src/components/dashboard/HomePage.tsx`, `npm run build`

## Owner checks by eye
Home with a same-day task and event, today and on another calendar day.

## Assumptions
- The range chip in the calendar's day list and the "Time:" label in the details window use the app's cyan (`text-primary`, `bg-primary/15`), the same shape as the existing green/red time chips (preview option B's colour).
- In Today's Tasks and Today's Events the range is plain grey text where "Starts: … · Due: …" was, with no "Time:" label, as the plan's "becomes the range" reads.
- The badge uses the app's outline badge (as the "Start" badge in the day list); in Today's lists it sits right after the name, since those cards have no type badge.

## Needs
nothing

## Notes
- The In progress cards open the same details window; their items started on an earlier day, so they keep the Start and End rows.
