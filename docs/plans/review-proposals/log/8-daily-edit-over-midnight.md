# 8. Daily task edit window open over midnight

**Status:** Built
**Branch:** `plan/review-proposals/8-daily-edit-over-midnight` (based on `main`)

## Done when
- [x] with the edit window open, switching the day closes it with the message, and no update is sent for yesterday's task — browser check with a fake clock in Thai time: opened "Edit Daily Task" at 23:59 on 31 Oct and changed the title; the test data then answered the new day's list with a new copy (new id, 1 Nov). At 00:00:02 the window closed, the message "A new day started, so this edit wasn't saved. Open today's task to edit it." showed, and no update request went out
- [x] editing during the same day works as before — same setup without the day change: Update closed the window and sent the update for that task
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint src/components/dashboard/DailyTasksSection.tsx`, `npm run build`

## Owner checks by eye
Hard to see for real (needs midnight); reading the message wording is enough.

## Assumptions
- The window closes only when the task is missing from the list **and** the list is for another day. A task deleted elsewhere during the same day leaves the window as it was before this change.
- The message uses the app's usual pop-up (Lulyssia's sticker, no extra line), like her other plain messages.

## Needs
nothing

## Notes
While the new day's list is still loading, Update is locked as before, so nothing can be saved to yesterday then either.
