# 11. Deadline before the start

**Status:** Built
**Branch:** `plan/review-proposals/11-deadline-before-start` (based on item 9's branch, `plan/review-proposals/9-keep-form-on-failed-save`)

## Done when
- [x] a task and an event with the deadline before the start can't be saved, and show the message — browser check: start 20 Nov 10:00, deadline 09:00, Create → "The deadline is before the start" under the deadline field, the form stays open, no save request; same for an event
- [x] equal dates, or a missing start or deadline, save as before — deadline equal to the start: saved and closed; deadline with no start: saved and closed (tasks and events)
- [x] after fixing the dates, saving works without reopening the form — changing the deadline to 10:00 removed the message straight away (before pressing anything), then Create saved
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

Also checked: the automatic "start + 5 hours" deadline still fills in (10:00 → 15:00); the deadline picker's earliest choice is the start (`min` = start); an existing task saved with its deadline a day before its start opens normally with no message, and Update then shows the message and saves nothing.

## Owner checks by eye
Open a task, move its start past its deadline and press Update.

## Assumptions
- The message is red text under the deadline field (the app's "destructive" colour), read out by screen readers when it appears.
- The browser's own "value must be … or later" bubble is replaced by the form's message, so there is only one message.
- The Events form's field is called "Deadline" there too, so the same message is used.

## Needs
nothing

## Notes
Built on item 9's branch (the plan: "if item 9 is built first, the refusal happens before Saving…"); merge item 9 first. The check is in `src/lib/dateOrder.ts`, shared by both forms.
