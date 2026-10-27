# 6. Pictures in Home's details

**Status:** Built
**Branch:** `plan/home-and-editor/6-details-pictures` (based on `main`)

## Done when
- [x] an event and a task with a shown picture and a PDF: the details window shows the picture and both chips, from the calendar's day list and from In progress — browser check (local dev server, test data, nothing reaches the live project): a task opened from In progress and an event opened from the calendar's day list each showed their shown picture (loaded) and the chips for all their files, in the order title, description, pictures, chips, times
- [x] a picture hidden from the card (eye off) isn't shown as a picture in the window, only as a chip — browser check: the eye-off photo appeared only as a chip
- [x] tapping the picture opens it; tapping the PDF chip opens the PDF — browser check: each opened a new tab with the file's link
- [x] an item without attachments shows the window as before — browser check: the window's text for a task with no files is the same as before (title, badges, description, times)
- [x] at 375px the window fits the screen and scrolls if needed — browser check at 375×700 with six shown photos: the window is 375px wide (page not wider), 644px tall, and scrolls down to the times
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

## Owner checks by eye
Open a task with a photo from Home's calendar and from In progress.

## Assumptions
- The pictures and chips sit together under the description with a small gap (the cards' own spacing); the "Description" heading is unchanged and the files have no heading of their own.
- The window's existing scroll and height limit (the app's dialogs already stop at 92% of the screen height and scroll) were enough; nothing about its size changed.

## Needs
nothing

## Notes
- Item 5 also edits this window and the In progress card; see the build summary for merging them together.
