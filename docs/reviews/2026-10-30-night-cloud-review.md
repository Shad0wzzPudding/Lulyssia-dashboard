# Cloud review, 30 Oct 2026 (night): rounds log

Branch `cloud-review-2026-10-30-night`: started from `cloud-review-2026-10-30-evening` (`main` at
`20750cd` plus that review's REVIEW.md update, not merged yet), so Phase 1 had nothing left to review.
Merge the evening branch first, or just this one: it contains it. Checks ran on a local copy only (the
app in a local browser with every backend request answered by test data, Deno for the functions).
Nothing reached the live project.

## Order of areas
The 30 Oct wrap-indent run covered areas 1–5, 7, 8, 10, 11, 13 and 14; 6, 9, 12 and 15 were last
covered on 27 Oct ("home and editor") and haven't changed since. Since 30 Oct only the editor (10)
changed (`cd2300d`, `b921686`). Order: 10 Editor → 6 Navigation → 9 Attachments → 12 LINE functions →
15 Time zones and dates.

## Phase 1
- Nothing waiting: the 4 commits after the last review were reviewed in the evening run.

## Phase 2
- Round 1 (10 Editor): read formatted-textarea.tsx in full; checked in a browser at 390×844 a 40-line description in the task form (box 420 px high and scrolls, the form scrolls, no sideways scroll), the new move-back-out button and Tab on four selected lines (selection kept after each press), and 5 Enters at the end of the text (5 new lines, caret stays in view); found no new bug
- Round 2 (6 Navigation, drawer and page changes): read Index.tsx and Navigation.tsx (menu, drawer, window count in useWindowOpen.ts); checked in a browser opening the menu with Enter, then Tab past its choices; found 1 fixed (`77d409a`): a form or the drawer opened from there stayed under the menu
- Round 3 (9 Attachments and storage clean-up): read AttachmentsField.tsx, heic.ts, cleanup-attachments and its migration (unused files: none of the three tables nor Recent Changes points to them, older than a day; storage rules keep each user in their own folder); found no new bug
- Round 4 (12 LINE functions): read send-line-reminders, send-line-overdue, missedDeadline.ts and recurrence.ts in full (window and once-only marks, the mark removed when a push fails, a repeat just past midnight looked for on both days, 31st-of-month repeats); deno check passes on all 7 functions; found no new bug
- Round 5 (15 Time zones and dates): read useLocalToday.ts, dateOrder.ts, autoDeadline.ts and the daily list's date code; checked in a browser that New York and Tokyo devices ask for their own day's list, and Home's Today's Tasks from 23:58 to 00:02 Thai time on 31 Oct (moves on to 1 Nov); found no new bug

Stopped: rounds 3, 4 and 5 found no new bug in a row, each on an area not covered before in this run,
and every area was covered in this run or the wrap-indent run with no changes since.
