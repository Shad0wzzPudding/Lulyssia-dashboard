# Build summary: home-delete

Built on 4 Nov 2026 against `main` at `4233001` (the plan was written at `a235a5e`; only the plan's own
files changed since).

## Items
| # | Item | Status | Branch |
| --- | --- | --- | --- |
| 1 | "+ / −" and delete mode in the date panel, asking before each delete | Built | `plan/home-delete/1-delete-mode` (from `main`) |
| 2 | "Don't ask again today" in the delete window | Built | `plan/home-delete/2-dont-ask-today` (on item 1's branch) |

## Merge order
Merge `plan/home-delete/summary` alone: the review of 4 Nov (done on this branch) merged both items into
it and added its fix. To take only item 1, merge `plan/home-delete/1-delete-mode` instead. (Done 4 Nov
2026: the commits were copied onto `main` in a line, `573bb6b`, `b9e45c3`, `4285705`, then the review's
fix with its notes.)

## Deploy checklist
Nothing to deploy or migrate: both items are front-end only and go out with Vercel when merged.

## Assumptions to go through
1. (Item 1) The delete button is 32×32 px; each item's bottom row grows by 12 px while delete mode is on.
2. (Item 1) After a confirmed delete, the focus goes to the "−" once the item has left the list, or to
   the plus when the date has become a Free Day.
3. (Item 1) A delete on its way ignores more clicks on that item. If two deletes run at once and the
   first fails, that item's button may stay ignored until Home is left (corrected at the review).
4. (Item 2) The box sits between the description and the buttons, centred, muted; the whole label is
   clickable.
5. (Item 2) After a delete without the window, the focus goes to the "−" once the item has left.

Nothing is blocked.

## Not verified
- On Test-dummy: deleting a "ZZ …" task and event from the panel, the Recent Changes entry and its undo,
  then cleaning up (items 1 and 2). This build doesn't write to the live project; everything else was
  checked with the local test backend. Worth doing after merging.
- The sounds weren't heard (headless browser); they play on the same lines as before.

## Seen while building, not changed (outside this plan)
- Lulyssia's confirm windows (all of them, e.g. Tasks' "Clear completed") don't move the keyboard focus
  into the window when it opens; Tab moves into it.
- At 360 px, a date-panel item whose title is one long unbroken word wraps one letter per line next to
  its badges (unchanged by this build).

## Owner checks by eye
- (Item 1) The `+ / −` and the red minus; the delete buttons on the items (on a phone too); the window
  and its sounds; the delete sound.
- (Item 2) The box in the window (look and place, on a phone too).
