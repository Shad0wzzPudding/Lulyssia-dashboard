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

**Last reviewed:** `a9aeb03` Docs : README covers the renewal job, the 30-day Recent Changes and the 08:00 run's parts

## Waiting for review

Newest first. The two Docs commits only change roadmap.md.

| Commit | What |
| --- | --- |
| `a4f4e29` | Feat : The drawer's LINE chip opens Settings at the LINE card |
| `40e94b1` | Feat : LINE status in the drawer |
| `9e5ed1f` | Feat : Bigger, bolder drawer rows as slanted slabs |
| `328f278` | Docs : Roadmap bug-hunt items back under their own headings |
| `24ba04c` | Chore : One shared "deadline = start + 5 h" helper for the Tasks and Events forms |
| `96b2012` | Chore : One shared photo-signing helper for the LINE functions |
| `a7a1871` | Perf : The 08:00 run no longer loads completed one-time tasks |
| `343d6e9` | Perf : The task list asks for renewal only when a repeating task is due |
| `ab7c50a` | Fix : LINE Settings reloads once when coming back to the app, and not while a switch is saving |
| `155747c` | Fix : Items created quickly one after another no longer tie in "User sort" |
| `68f6735` | Fix : Holding a card near a screen edge no longer scrolls the page by itself |
| `ef487fa` | Fix : A failed morning message no longer loses that day's missed-deadline repeats |
| `b1a895c` | Docs : Code review findings in roadmap.md |

## Review history

| Date | Range | Result |
| --- | --- | --- |
| 2026-10-12 | `c6c2f21..a9aeb03` (the bug-hunt branch, 27 commits) | 8 confirmed findings (5 edge-case bugs, 3 clean-ups), all fixed in `ef487fa`..`24ba04c`; 1 reported finding was not a bug |
