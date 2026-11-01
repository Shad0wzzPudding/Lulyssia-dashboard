# Cloud review, 1 Nov 2026: rounds log

Branch `cloud-review-2026-11-01`. Checks ran on a local copy only: the app in a local browser with
every backend request answered by test data (the iPhone status and home bars set through Chromium's
safe-area override). Nothing reached the live project.

## Order of areas
The 31 Oct run covered areas 1–4, 7, 8, 10–12, 14, 15; the 31 Oct late run covered 3, 5, 6, 9, 13, 14
and the angles double clicks, failed and slow saves, long words, many items and offline. Since then
only the editor (10) changed (the three phone checklist fixes). Order: 10 Editor → the angles not done
yet (keyboard only and screen reader names, access rules, the installed app) → then the areas with the
most code, with fresh eyes (2 Tasks, 11 Data hooks, 1 Home).

## Phase 1
- The first part of this run (review only): the 11 waiting commits, 2 fixed (`1a90e11`, `aad6bfd`);
  see REVIEW.md's history.

## Phase 2
- Round 1 (10 Editor): read the checklist parts of formatted-textarea.tsx (Enter on a checklist line, the Check button, the Backspace rule, ticking) and checklist.ts in full; checked in the browser typing after Check and Enter, Backspace on an emptied checklist line, ticking while the caret is elsewhere; found 1 proposed (no keyboard or screen-reader way to tick a box in the editor)
- Round 2 (angle: keyboard only and screen reader names): swept every page, the three forms, the drawer and Settings in the browser for controls with no name; found 2 fixed (`13fac70`: the 15 volume sliders had no name; `489c62b`: the description box had no name). Inputs named only by their placeholder and buttons named by their title were left as they are: browsers use those as names
- Round 3 (angle: access rules): read the line_links guard, revert_activity_log (only tasks, events and interests; only the caller's rows), lineImages.ts (only files in the owner's folder), the webhook's "Mark as done" (only the linked account's tasks) and who may call each LINE function (send-line-daily for a user: only their own link, with the month's allowance and 3-a-day limit; line-rich-menu and cleanup: cron secret only); found no new bug
- Round 4 (angle: the installed app): measured in the browser with the iPhone's status and home bar insets (390×844, 375×667, 393×852, 430×932) the task form with a long description; found 1 fixed (`a5f1313`: on the Dynamic Island iPhones the form's title and close X began under the status bar)
