# 5. Installed app's "Add Task" shortcut does nothing

**Status:** Built
**Branch:** `plan/review-proposals/5-add-task-shortcut` (based on `main`)

## Done when
- [x] opening `/?action=add-task` while signed in shows the Tasks page with the new-task form open — browser check (test data): Tasks page, "Create New Task" form open and empty, the cursor in the title box
- [x] the address no longer has `?action=add-task` afterwards; reloading shows Tasks without the form — the address is `/` right away and a reload doesn't open the form. Partly as written: the reload shows **Home**, not Tasks, because the app never remembers the open page across a reload (see Assumptions)
- [x] opening `/` and `/?action=something-else` behave as before — both open Home with no form; the unknown action is left in the address untouched
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

Also checked: signed out, `/?action=add-task` goes to the sign-in page; after signing in (session stored, then `/` as the sign-in page does), Tasks opens with the new-task form.

## Owner checks by eye
On an Android phone with the app installed, long-press the icon → Add Task. (On a computer: open `/?action=add-task` in the browser.)

## Assumptions
- **Reload goes to Home, not Tasks.** The plan expected a reload to show Tasks. The app has never kept the open page across a reload (every reload starts on Home), and making it do so would be a new feature, so a reload simply opens Home without the form.
- The request is kept through sign-in in this tab's session storage (it's gone when the tab or app is closed), so signing in still opens the form.
- No sound plays when the form opens this way (the usual "add" sound plays when the Add button is pressed by hand).
- The form opens once the dashboard has loaded; if loading fails, it isn't opened later.

## Needs
nothing (the shortcut is already in public/manifest.json)

## Notes
No page-change train for this jump: it uses the plain page switch.
