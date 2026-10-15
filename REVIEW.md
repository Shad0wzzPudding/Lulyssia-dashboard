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

**Last reviewed:** `36c0c12` Chore : Plan template and /cloud-build skill for the plan → build → review cycle

## Waiting for review

Newest first. Made during the cloud review of 15 Oct 2026 (branch `cloud-review-2026-10-15`), so nobody has reviewed them yet.

| Commit | What |
| --- | --- |
| `2f00005` | Fix : The undo and unpin handles on Home work from the keyboard |
| `50359b1` | Fix : Retyping a repeating task's "Every N" number saves the number typed (3, not 13) |
| `d11a092` | Fix : Long titles in the calendar details and a long LINE name in Settings fit a narrow phone |
| `2679f61` | Fix : A link in a description no longer makes pages wider than a phone screen |
| `793b94d` | Fix : A long one-word tag name no longer makes the Interests page wider than a phone screen |
| `2256582` | Fix : A long email in the header greeting no longer makes a narrow phone screen slide sideways |
| `33bf296` | Docs : README lists the nightly job that trims the record of sent LINE messages |
| `ee9bfb4` | Fix : A quick double Enter no longer creates the same tag twice |
| `d66f5bf` | Fix : Copying several items at once keeps their order in "User sort" |
| `9904b83` | Fix : Screen readers name the icon buttons on cards (copy, edit, delete, tick, pin, fold) |
| `a221782` | Fix : The LINE "today" limit can't be reset by deleting and recreating the LINE link (needs migration 20261015000005_line_links_no_delete.sql) |
| `9fbb892` | Fix : A dragged card stays where it was dropped instead of jumping back while the new order saves |
| `01e6af3` | Fix : An upload still running when a form is closed no longer lands in the next form that opens |
| `61fd3a2` | Fix : Clicks in a scrolled add/edit form no longer start resizing the form window |
| `65516f4` | Fix : Search finds words that are bold, and text with *, ~ or a backslash in the description |
| `0079d00` | Fix : Editing an interest no longer puts back an unpin or a drag made elsewhere while the form was open |
| `f1aef58` | Fix : A long unbroken title (like a web address) no longer makes pages wider than a phone screen |
| `bfaeaef` | Fix : Undoing an edit in Recent Changes no longer moves the item back to its old place (needs migration 20261015000004_revert_keeps_order.sql) |

## Review history

| Date | Range | Result |
| --- | --- | --- |
| 2026-10-12 | `c6c2f21..a9aeb03` (the bug-hunt branch, 27 commits) | 8 confirmed findings (5 edge-case bugs, 3 clean-ups), all fixed in `ef487fa`..`24ba04c`; 1 reported finding was not a bug |
| 2026-10-13 | `a9aeb03..a4f4e29` (13 commits, cloud session) | 1 confirmed finding (LINE Settings: a reload already running when a switch is flipped can still show the old value for a moment), in roadmap.md under "Code review (13 Oct 2026, cloud)"; typecheck and lint pass |
| 2026-10-15 | `a4f4e29..36c0c12` (37 code commits, plus docs and skill commits; cloud session) | 1 confirmed finding (undoing an edit moved the item back to its old place in User sort), fixed in `bfaeaef`. Checked: tsc, eslint, build, deno check on all functions; all migrations replayed on a local Postgres; the editor's formatting and LINE's text cleaning compared on random texts |
