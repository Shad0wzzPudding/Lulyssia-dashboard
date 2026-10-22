# 9. A failed save loses what was typed

**Status:** Built
**Branch:** `plan/review-proposals/9-keep-form-on-failed-save` (based on `main`)

## Done when
- [x] with the save request made to fail, the form stays open with all fields kept and the new message, on Tasks, Events and Interests, for both create and edit — browser check (test data; the save answered with a server error): all six cases kept the form open with what was typed (and a deadline typed into the task form), button back to "Create"/"Update", message "Couldn't save. Check your connection and press Create again." / "…press Update again."
- [x] with it succeeding, the form closes and behaves as before — same six cases with the save succeeding: the form closed and the usual "… created successfully!" / "… updated successfully!" showed
- [x] the button shows "Saving…" and can't be pressed twice while the request is out — with a 1.5s slow save: the button read "Saving…" and was disabled; a second click and a second Enter/submit sent nothing more (1 save request each time)
- [x] the daily quick add keeps its text on failure and clears it on success — browser check: "Feed the cat" and 07:30 stayed after a failed save, with "…press Add again."; the button was disabled while saving; on success both boxes cleared
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

Also checked: the daily edit window keeps its text on failure, shows "Saving…", and closes on success; pressing Cancel while a save is running and then opening another task's form: the late save doesn't close or clear the new form.

## Owner checks by eye
Turn Wi-Fi off on the phone, try to save a task, turn it back on and press Create again.

## Assumptions
- The daily quick add's button is a "+" icon, so its failure message says "press Add again" (the button's name for screen readers is "Add daily task"). While saving, the "+" is disabled and its name reads "Saving…"; nothing else changes on screen.
- A failure after the form was closed shows the same message (it still says "press Create again"), as the plan says a failure then only shows the message.
- Copies made with a card's copy button don't go through the form, so they work as before.

## Needs
nothing

## Notes
- The save functions take an optional marker naming the form's button; it is removed before anything is sent to the database. Without it (ticks, pins, copies), the old messages show as before.
- A save started from a form that has since been closed is let go: its answer can't close or clear a form opened after it.
