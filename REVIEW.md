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
