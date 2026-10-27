# 5. Edit tasks and events from Home

**Status:** Built
**Branch:** `plan/home-and-editor/5-edit-from-home` (based on `main`)

## Done when
- [x] each of the six places shows a pencil after a task's or event's name — browser check (local dev server, test data, nothing reaches the live project): Today's Tasks, Today's Events, In progress, Upcoming (tasks and events) show 6 pencils; picking a calendar day adds the day list's pencils (8); the details window has one next to its title
- [x] clicking it opens that item's edit form on Home, filled in; saving changes the item and Home shows the new value without a reload; Cancel changes nothing; the page stays Home — browser check: each place opened "Edit Task"/"Edit Event" with the right title; Update from Today's Tasks sent one save, closed the form and Home showed the new title, still on Home; Cancel from Today's Events sent nothing; the details window's pencil closed the details and opened the form, and saving updated the calendar's list
- [x] clicking the pencil in In progress or the calendar's day list doesn't open the details window — browser check: only the edit form was open (one window); clicking the card itself still opens the details window
- [x] the Tasks and Events pages' own add, edit and copy forms work as before (same checks as before: dates, saving, offline, attachments, tags, repeat, notice) — browser script run on `main` and on this branch with the same test data; the 29 lines of results are identical: the deadline-before-start message, the +5 h automatic deadline, offline refusal ("Couldn't save…", form stays open), a failed save keeping the form and its text, Create with tags + repeat every 3 weeks + Notice before + a PDF attachment (saved fields identical), the edit form filled in (dates, repeat, Notice, bold description), Update, Copy, the add form empty after an edit, Cancel. Also: the "Add Task" shortcut (`/?action=add-task`) still opens the empty form with the cursor in the title
- [x] keyboard: the pencil can be reached with Tab and opened with Enter — browser check: Tab from an In progress card lands on its pencil, Enter opens the edit form; the other pencils are ordinary buttons
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json` (also on the first commit alone), `npx eslint` on the changed files, `npm run build`

## Owner checks by eye
Edit a task and an event from Home (from Today's lists and from the calendar), and edit one on the Tasks page to see it's unchanged.

Also new to look at: the pencil itself (small, grey until hovered, cyan on hover), on a computer and a phone.

## Assumptions
- **The In progress cards are no longer `<button>`s** but clickable cards that behave like buttons (Tab reaches them, Enter or Space opens the details). A button can't hold another button (the pencil), so this was the smallest way to put the pencil after the name there. They look the same, with a focus ring when reached with Tab.
- The pencil is a 20 px button with a 12 px lucide `Pencil` icon, placed inside the name so it wraps with the last word.
- Pencils inside the "+N more" lists (opened from the cover) work too: the form opens on top of that list.

## Needs
nothing

## Notes
- Two commits: first the forms move out of TasksPage.tsx and EventsPage.tsx into `TaskFormDialog.tsx` and `EventFormDialog.tsx` unchanged (checked line by line: only the indentation, the "Add" button now passed in from the page, and the `Attachment` type import differ); then Home's pencils.
- Items 1 and 6 also change HomePage.tsx; see the build summary for merging them together.
