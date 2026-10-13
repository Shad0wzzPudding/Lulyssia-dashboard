# Code review tracking

<!--
The plan, for anyone (or any Claude session, local or cloud) working on this repo:

- This file keeps track of which commits have had a code review and which are still waiting.
  It lives in the repo (not in local git settings) so a cloud session, which starts from a fresh
  copy of GitHub, can read and update it too.
- "Review" here means a code review: looking for bugs, performance problems and things worth
  refactoring. It is not a summary of what changed.
- "Last reviewed" is the source of truth. Everything after it on main is unreviewed:
      git log --oneline <last reviewed>..main
- After committing work, refresh the "Waiting for review" list from that command (newest first),
  in the same push, so the list always matches main.
- When a review is done: set "Last reviewed" to the newest commit that was reviewed, clear the
  waiting list, and add a line to "Review history". Fixes committed because of the review are
  new commits after that point, so they get checked in the next review.
- If the waiting list covers about 8-10 files or more, ask first whether to review all of it or
  only part.
- Only review when asked; don't run a review automatically after every task.
-->

**Last reviewed:** `a4f4e29` Feat : The drawer's LINE chip opens Settings at the LINE card

## Waiting for review

Newest first. The commits in between only change roadmap.md and REVIEW.md (the cloud bug hunt findings and this file), so they need no review.

| Commit | What |
| --- | --- |
| `1d7dd42` | Fix : On phones the Overdue, Completed and Today badges sit under the title instead of squeezing it |
| `25f5cea` | Fix : The record of sent LINE messages is trimmed to the last week every night |
| `c9cee66` | Fix : Long descriptions in LINE are cut at about 300 characters with a note to read the rest in the dashboard |
| `7bc5495` | Fix : Undo and unpin swipes start from a handle, so selecting text can't trigger them |
| `c4f75a2` | Fix : Linking LINE again keeps the morning letter's setting, and the link button is hidden while linked |
| `0c6d175` | Fix : LINE "today" no longer repeats the Notice before card, and the new "notice" command sends it on request |
| `6469d71` | Fix : A LINE Settings reload that was already running when a switch is flipped no longer shows the old value |
| `6acbbe3` | Fix : The 404 page uses the app's dark background, so its text is readable |
| `23d73eb` | Fix : The LINE checks only load the tasks and events they need, and Recent Changes and interests get indexes |
| `5c9a2c1` | Fix : Deleting a tag takes it off its items, and Sort by tag skips tags that no longer exist |
| `214d66f` | Fix : The first missed-deadline nudge says how many days late the task is |
| `8053d2f` | Fix : Picture previews on cards renew their links, so a page left open keeps its pictures |
| `b964f2a` | Fix : Opening an attachment opens its tab right away, so Safari doesn't block it |
| `ca146e0` | Fix : Backslashes and back-to-back bold/italic text keep their formatting when saved |
| `0c01b97` | Fix : Saving an edit form no longer unticks a task that was ticked elsewhere while the form was open |
| `3ebedd3` | Fix : Clear Completed only deletes the finished tasks the page has loaded, so Undo brings all of them back |
| `c7e8a70` | Fix : Linking LINE says when it failed, and a LINE account moved to another dashboard account no longer leaves its name behind |
| `156be2c` | Fix : The daily routine is copied even if a task was added before the day was set up, and yesterday's list can't be changed while today's loads |
| `a67f00b` | Fix : A starting-soon reminder LINE refuses gets another try, and no longer stops the other reminders |
| `9fa4d34` | Fix : Picked items hidden by a search or filter are no longer picked, so Delete only removes what's on screen |
| `9550a9c` | Fix : Saving waits until an attachment has finished uploading |
| `630641e` | Fix : Only the newest Recent Changes entry per item can be undone, one step at a time |
| `0f5d8be` | Fix : Main Focus hints sit on the right on phones |
| `b6a9498` | Feat : LINE "today" limited to 3 a day per person, with this month's usage in Settings |
| `076b8f0` | Fix : Main Focus header fits on phones, and Lulyssia's "nothing to collapse" bubble stays on screen |

## Review history

| Date | Range | Result |
| --- | --- | --- |
| 2026-10-12 | `c6c2f21..a9aeb03` (the bug-hunt branch, 27 commits) | 8 confirmed findings (5 edge-case bugs, 3 clean-ups), all fixed in `ef487fa`..`24ba04c`; 1 reported finding was not a bug |
| 2026-10-13 | `a9aeb03..a4f4e29` (13 commits, cloud session) | 1 confirmed finding (LINE Settings: a reload already running when a switch is flipped can still show the old value for a moment), in roadmap.md under "Code review (13 Oct 2026, cloud)"; typecheck and lint pass |
