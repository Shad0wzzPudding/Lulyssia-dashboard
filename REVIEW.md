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

**Last reviewed:** `33e1578` Fix : LINE messages call an event's second time "Ends", like the app (needs function deploy: send-line-daily, send-line-reminders)

## Waiting for review

Newest first. The first 2 were made during the cloud review of 26 Oct 2026 (branch
`cloud-review-2026-10-26`). The last 4 are the pop-up messages and the menu button (26 Oct 2026,
branch `fix/toasts-behind-nav`): they reached `main` while that review was running and come before
"Last reviewed" in the history (the review's commits were replayed on top of them), but nobody has
reviewed them yet.

| Commit | What |
| --- | --- |
| `fff28a5` | Fix : Task and event titles show clear gaps between words |
| `6a00462` | Fix : Ticking an overdue repeating task no longer says it comes back at a time already gone |
| `fcad22f` | Fix : The menu button leaves and comes back at once with Side menu effects off or reduced motion |
| `86bfd64` | Feat : The round menu button slides out while a form is open, and back when it closes |
| `246dbf1` | Feat : Pop-up messages can be swiped away sideways, also while a form is open |
| `85ba844` | Fix : Pop-up messages sit behind the menu button instead of covering it |

## Review history

| Date | Range | Result |
| --- | --- | --- |
| 2026-10-12 | `c6c2f21..a9aeb03` (the bug-hunt branch, 27 commits) | 8 confirmed findings (5 edge-case bugs, 3 clean-ups), all fixed in `ef487fa`..`24ba04c`; 1 reported finding was not a bug |
| 2026-10-13 | `a9aeb03..a4f4e29` (13 commits, cloud session) | 1 confirmed finding (LINE Settings: a reload already running when a switch is flipped can still show the old value for a moment), in roadmap.md under "Code review (13 Oct 2026, cloud)"; typecheck and lint pass |
| 2026-10-15 | `a4f4e29..36c0c12` (37 code commits, plus docs and skill commits; cloud session) | 1 confirmed finding (undoing an edit moved the item back to its old place in User sort), fixed in `bfaeaef`. Checked: tsc, eslint, build, deno check on all functions; all migrations replayed on a local Postgres; the editor's formatting and LINE's text cleaning compared on random texts |
| 2026-10-23 | the build of plan review-proposals (branches `plan/review-proposals/1`..`11`, merged in order) | 1 confirmed finding (after the "Add Task" shortcut, every later visit to Tasks opened the form again), fixed in `6e55a17`; item 9's offline case found waiting instead of failing, changed with the owner in `582d5cd`. Checked: tsc, eslint, build, and all 11 owner checks in the browser. Last reviewed stays at `36c0c12`: the 15 Oct waiting list wasn't part of this review |
| 2026-10-25 | `36c0c12..58308d3`: the 15 Oct cloud review's fixes, the plan review-proposals build and its review follow-ups, the 23 Oct editor/tag list/repeating task fixes and the 25 Oct bulk delete (40 commits listed, 50 code commits) | 1 finding fixed (`aee35f4`: Home still said Deadline/Due for an event's end); 2 small proposals put in the roadmap's backlog (the delete question doesn't count folded completed tasks and past events; LINE's starting-soon card says Deadline for events). Checked: tsc, eslint on src, build, and the newest features in a local browser with test data (cloud review, review only) |
| 2026-10-26 | the 25 Oct cloud review's 3 fixes `aee35f4`, `a85c51c`, `33e1578` (branch `cloud-review-2026-10-25`; cloud session; IDs as replayed onto `main` on 26 Oct) | No new finding. Checked: the diffs with the code around them; tsc, eslint, build |
