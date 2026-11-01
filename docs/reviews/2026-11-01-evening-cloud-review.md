# Cloud review, 1 Nov 2026 (evening): rounds log

Branch `cloud-review-2026-11-01-evening` from `main` at `b1b86fc` (the 1 Nov review merged, plus the
editor's copy/paste and Ctrl+Enter features). Checks ran on a local copy only: the app in a local
browser with every backend request answered by test data. Nothing reached the live project.

## Order of areas
Every area was covered today by the three 1 Nov runs. Since then the editor (10) changed (the three
features), and today's own fixes touched Interests (4), Tasks (2), Events (3) and Home (1). Order:
10 Editor → 4 Interests and Home's Main Focus → 2 Tasks → 3 Events → 1 Home.

## Phase 1
- The 3 editor features (`d2116f3`, `52d3e53`, `a9ff277`): read each diff with the code around it;
  checked in the browser Ctrl+Enter on one line and on three lines (one unticked → all ticked, again →
  all off, Undo), the boxes' names, copy and cut (and Undo) and five paste cases; found 1 fixed
  (`a439793`: a copied line with its line break pasted onto a box line left an empty line, and from
  the line's start went below it).
- The 13 fixes of the 1 Nov review: re-ran their browser checks on the merged `main` (double clicks,
  form focus on open, long words at 320px, the LINE card offline, batch pin refused, the undo handle,
  the iPhone status bar); all still hold.

## Phase 2
- Round 1 (10 Editor): read the copy, cut, paste and Ctrl+Enter code in formatted-textarea.tsx; checked in the browser Ctrl+A and copy of a description with bold, italic and an indented checklist, pasted back and saved (boxes, ticks and indents kept, formatting plain as designed); found no new bug
- Round 2 (4 Interests and Home's Main Focus): read DraggableInterestCard.tsx's swipe and keyboard unpin and Home's unpin; checked in the browser two quick Enters on the unpin handle and an unpin refused by the server, and a refused undo in Recent Changes (the entry comes back); found 2 fixed (`1c2f231`: unpinned twice; `b11ad23`: after a refused unpin the card stayed slid out)
- Round 3 (2 Tasks): re-ran the earlier Tasks checks on the merged code: Clear Completed (deletes by id), an edit keeping the deadline when the start changes, a repeating task's anchor after a title-only edit and a moved deadline, "This round is done"; found no new bug (two old scripts were out of date: the form now stays open on a failed save, and Undo is a hold button)
- Round 4 (3 Events): re-ran the earlier Events checks: an end before the start refused, clearing the start, the cards' End labels, copies keeping every field and their order, "Start and end today" in the calendar list and details; found no new bug
- Round 5 (1 Home): re-ran the earlier Home checks: 360 and 390px (no sideways scroll, no errors), midnight in Thai time (Today's Tasks moves on), three quick ticks with slow saves, the "+N more" counts in the delete question; found no new bug

Stopped: rounds 3, 4 and 5 found no new bug in a row, each on an area not covered before in this run,
and every area was covered today.
