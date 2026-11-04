# 2. "Don't ask again today" in the delete window

**Status:** Built
**Branch:** `plan/home-delete/2-dont-ask-today` (based on item 1's branch, `plan/home-delete/1-delete-mode`)

## Done when
- [x] the window shows the unticked box, and it can be ticked with a click, a tap or the keyboard (Space) — local browser with test data: unticked on opening; a click on its label ticks it, Space on the focused box toggles it, a tap ticks it at 375 px (touch)
- [x] ticked + confirm: the next delete on Home's calendar that day goes straight through, with the delete sound and toast; ticked + Nevermind~: the next delete asks again — ticked + confirm stores `2026-11-04` in `homeDeleteNoAskDate`, and the next delete sends at once with no window (toast "Task deleted successfully!"); a double click on it sends one delete. Ticked + Nevermind~ stores nothing; the next delete asks, with the box unticked. At 23:50 Thai time ticked, then at 00:05 the window asks again. The delete sound itself was not heard (headless browser); it's played on the same line of code as with the window
- [x] with the stored date set to yesterday (set the key by hand), the window asks again; a broken or missing key asks — `2026-11-03` asks; `{oops` asks; no key asks
- [x] the other confirm windows (e.g. Tasks' "Clear completed", select mode's delete) have no box and work as before — Tasks' "Clear completed" window: same text and buttons, no box or label, clearing works. Every other window uses the dialog without the new prop, so the box isn't drawn there
- [ ] on Test-dummy with "ZZ …" items, cleaned up afterwards — not verified on Test-dummy: this build doesn't write to the live project (checked with the local test backend above); worth doing after merging
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

## Owner checks by eye
- The box in the window (look and place, on a phone too).

## Assumptions
- The box sits between the description and the buttons, centred, in the description's muted colour;
  the whole label is clickable.
- After a delete without the window, the focus goes to the "−" once the item has left (as after a
  confirmed delete in item 1).

## Needs
nothing

## Notes
- `thaiToday` moved to `src/lib/thaiDate.ts`; LineSettings uses it from there (unchanged behaviour).
- The "don't ask" memory is in `src/lib/homeDeleteNoAsk.ts` (`localStorage` key `homeDeleteNoAskDate`,
  every read and write wrapped in try/catch).
- `LulyssiaConfirmDialog` gets an optional `dontAskLabel`; `onConfirm` now receives whether the box
  was ticked (other uses ignore it).
