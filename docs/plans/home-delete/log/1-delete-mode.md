# 1. "+ / −" and delete mode in the date panel, asking before each delete

**Status:** Built
**Branch:** `plan/home-delete/1-delete-mode` (based on `main`)

## Done when
- [x] the header shows `+ / −`, and the plus works as before (menu, New task / New event) — local browser with test data: the header reads "+ / −" (the slash isn't a button); the plus opens "New task" / "New event"
- [x] the minus toggles delete mode: `aria-pressed` and red when on; the hint shows; each item has a named delete button at its bottom right; nothing in the list shifts when it turns on, beyond the button's row — `aria-pressed` false → true, `text-red-500` and the faint red background on; the hint line shows; buttons "Delete task: ZZ task", "Delete event: ZZ event", 32×32 px, at the right of the time chips; each item grows by 12 px (the button is taller than the chips), nothing else moves
- [x] delete mode turns off on the minus, on picking another date, and after the last item is deleted; the minus is disabled on a Free Day; coming back to Home starts with it off — all four checked in the browser
- [x] clicking an item card in delete mode opens its details; clicking its delete button doesn't — card click opens the details window; the delete button opens only the delete window
- [ ] on Test-dummy, a "ZZ …" task and a "ZZ …" event deleted from the panel — not verified on Test-dummy: this build doesn't write to the live project. Checked with the local test backend: the window reads "Delete this event?" / "\"ZZ event\" will be deleted. You can undo it from Recent Changes on Home." / "Nevermind~" / "Yes, delete it!"; Nevermind~ and Escape keep the item (no delete sent); confirming sends one delete, the item leaves the panel and the toast "Event deleted successfully!" shows. The Recent Changes entry and its undo come from the database (the same delete as the Tasks and Events pages), so they need the real project: worth doing on Test-dummy after merging, then cleaning up
- [x] a double click on a delete button and on "Yes, delete it!" sends one delete — double click on "Yes, delete it!": one DELETE request; double click on a delete button: one window, and one DELETE after confirming
- [x] the Tasks and Events pages' delete buttons still delete without a window — Tasks page: the card's Delete sends the delete at once, no window (the Events page's buttons weren't touched)
- [x] keyboard: Tab reaches the minus and each delete button, Enter/Space work, and focus goes back sensibly after the window closes; the item isn't announced twice — Tab from the plus reaches the minus, Space turns it on, Tab reaches each delete button, Enter opens the window; after Escape the focus is back on the delete button; after a confirmed delete it goes to the "−" once the item has left (to the plus when the date is now free); the card itself isn't a focus stop, so only the button's name is read
- [x] at 360-430px wide: the header and items fit, no sideways scroll — 360 and 430 px: page width equals the screen, all delete buttons shown (screenshot checked)
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

## Owner checks by eye
- The `+ / −` and the red minus; the delete buttons on the items (on a phone too); the window and its
  sounds; the delete sound.

## Assumptions
- The delete button is 32×32 px (`size="icon"` made smaller); each item's bottom row grows by 12 px while
  delete mode is on.
- After a confirmed delete, the focus moves to the "−" once the item has left the list (its button is
  gone), or to the plus when the date has become a Free Day (the "−" is disabled then).
- A delete that's already on its way ignores more clicks on that item's button; the guard lets go when
  the delete is answered. If two deletes run at once and the first fails, that item's button may stay
  ignored until Home is left (the app only reports the latest delete's answer). (Corrected at the review: picking another date doesn't free it, and shouldn't, since the same item can show on two dates and a second delete of it would be sent.)

## Needs
nothing

## Notes
- `main` moved from `a235a5e` to `4233001` since the plan was written: only the plan's own files.
- Seen while checking, not changed (outside this plan):
  - Lulyssia's confirm windows (every one in the app, e.g. Tasks' "Clear completed") don't move the
    keyboard focus into the window when it opens: it stays on the button that opened it, and Tab moves
    into the window. Worth a look at the next review.
  - At 360 px, a date-panel item whose title is one long unbroken word (a web address) wraps one
    letter per line next to its badges. That row is unchanged by this build.
