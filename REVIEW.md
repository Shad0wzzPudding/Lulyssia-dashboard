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

**Last reviewed:** `20750cd` Docs : REVIEW.md waiting list adds the iPhone editor changes, roadmap.md closes the iPhone note

## Waiting for review

Newest first.

| Commit | What |
| --- | --- |
| `c04d02f` | Fix : The LINE morning letter says which part of an event or task is today (31 Oct; needs function deploy: send-line-daily) |
| `77d409a` | Fix : The round menu closes when a form or the side drawer opens from the keyboard (cloud review 30 Oct night) |

## Review history

| Date | Range | Result |
| --- | --- | --- |
| 2026-10-12 | `c6c2f21..a9aeb03` (the bug-hunt branch, 27 commits) | 8 confirmed findings (5 edge-case bugs, 3 clean-ups), all fixed in `ef487fa`..`24ba04c`; 1 reported finding was not a bug |
| 2026-10-13 | `a9aeb03..a4f4e29` (13 commits, cloud session) | 1 confirmed finding (LINE Settings: a reload already running when a switch is flipped can still show the old value for a moment), in roadmap.md under "Code review (13 Oct 2026, cloud)"; typecheck and lint pass |
| 2026-10-15 | `a4f4e29..36c0c12` (37 code commits, plus docs and skill commits; cloud session) | 1 confirmed finding (undoing an edit moved the item back to its old place in User sort), fixed in `bfaeaef`. Checked: tsc, eslint, build, deno check on all functions; all migrations replayed on a local Postgres; the editor's formatting and LINE's text cleaning compared on random texts |
| 2026-10-23 | the build of plan review-proposals (branches `plan/review-proposals/1`..`11`, merged in order) | 1 confirmed finding (after the "Add Task" shortcut, every later visit to Tasks opened the form again), fixed in `6e55a17`; item 9's offline case found waiting instead of failing, changed with the owner in `582d5cd`. Checked: tsc, eslint, build, and all 11 owner checks in the browser. Last reviewed stays at `36c0c12`: the 15 Oct waiting list wasn't part of this review |
| 2026-10-25 | `36c0c12..58308d3`: the 15 Oct cloud review's fixes, the plan review-proposals build and its review follow-ups, the 23 Oct editor/tag list/repeating task fixes and the 25 Oct bulk delete (40 commits listed, 50 code commits) | 1 finding fixed (`aee35f4`: Home still said Deadline/Due for an event's end); 2 small proposals put in the roadmap's backlog (the delete question doesn't count folded completed tasks and past events; LINE's starting-soon card says Deadline for events). Checked: tsc, eslint on src, build, and the newest features in a local browser with test data (cloud review, review only) |
| 2026-10-26 | the 25 Oct cloud review's 3 fixes `aee35f4`, `a85c51c`, `33e1578` (branch `cloud-review-2026-10-25`; cloud session; IDs as replayed onto `main` on 26 Oct) | No new finding. Checked: the diffs with the code around them; tsc, eslint, build |
| 2026-10-27 | the 8 commits on the waiting list (`85ba844`, `246dbf1`, `86bfd64`, `fcad22f`, `6a00462`, `fff28a5`, `019fd3a`, `fe1bd55`) plus `789692e` (cloud session) | No new finding. Checked: the diffs with the code around them; in a local browser, a title with a run of spaces, the menu button leaving and returning with a form, and a click on a pop-up message keeping the form open |
| 2026-10-27 | review only, after the cloud review: `main` unchanged since `789692e` (nothing waiting there); re-read this branch's own fixes `aef5a5a`, `99fc59a` | 1 finding in `99fc59a` (a half-failed clear didn't reload its list), fixed in `b2b4c9b` |
| 2026-10-27 | `789692e..5e4f2a9` on `main` (5 code commits: `aef5a5a`, `99fc59a`, `b2b4c9b`, `8255ea5`, `74fc1a2`, plus docs) and the plan home-and-editor build (the 9 `plan/home-and-editor/*` branches: 13 code commits and 2 merges), cloud session | Phase 1: 2 confirmed findings, both in the build, fixed in `bfcfce1` (Editor setting kept across a change of account) and `41e38f7` (Enter during composition lost the word); the bug hunt after it fixed 1 more (`2f00e3c`) and proposed 2 (roadmap.md, "Cloud review (27 Oct 2026, home and editor)"). Checked: the diffs with the code around them; the fixes in a local browser with test data |
| 2026-10-30 | the 11 commits on the waiting list (`bfcfce1`, `41e38f7`, `2f00e3c`, `36731eb`, `a454282`, `590871a`, `ff6cd78`, `ba16917`, `55a0748`, `de1375c`, `b1dc582`), up to `aed71e7` (cloud session, review only) | 1 finding fixed (`23443fc`, `99a057f` on the review branch: after a failed first read, a change of the Editor setting was silently not saved). Checked: the diffs with the code around them; tsc, eslint on src, build; in a local browser the Editor setting with its read failing and then working, and the event form's Start/End labels and End message |
| 2026-10-30 | `aed71e7..48da2b3` on `main` (2 code commits: `23443fc`, `e240ea1`, plus docs) and the plan wrap-indent build (the 4 `plan/wrap-indent/*` branches: 3 code commits), cloud session | Phase 1: 1 confirmed finding, in the build, fixed in `31c33bf` (indents measured during the windows' opening zoom came out a few pixels short); the bug hunt after it fixed 1 more (`22b039b`, in `23443fc`'s path: the Editor setting stuck on Quick space after a failed read and a failed save), no proposals. Checked: the diffs with the code around them; in a local browser with test data, the editor's keys on the old and new editor (same text after every step) |
| 2026-10-30 | the 4 commits on the waiting list (`31c33bf`, `22b039b`, `cd2300d`, `b921686`), up to `20750cd` (cloud session, review only) | No new finding. Checked: the diffs with the code around them; tsc, eslint on src, build; in a local browser at 390px the description box (16px text, up to half the screen, toolbar fits) and the new move-back-out button (12 spaces → 6 → 0, then stays) |
