# 1. Drag handle on unpinned interest cards

**Status:** Built
**Branch:** `plan/review-proposals/1-interest-drag-icon` (based on `main`)

## Done when
- [x] the `GripVertical` icon line in `renderUnpinnedCard` (InterestsPage.tsx) is gone, and the unused import with it if nothing else uses it — line removed; nothing else in InterestsPage.tsx used `GripVertical`, so it left the import too
- [x] "User sort" on Interests still shows the list's handle and dragging still works — browser check (local dev server, test data, nothing reaches the live project): no grab icon on the cards in "Deadline (soonest)" or "User sort"; in "User sort" each card has the list's handle (4 of 4), and dragging Piano onto Guitar showed Piano, Guitar, Chess and sent the saves
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint src/components/dashboard/InterestsPage.tsx`, `npm run build`

## Owner checks by eye
The Interests page in "User sort" and in another sort.

## Assumptions
none

## Needs
nothing

## Notes
roadmap.md: the item's line is ticked with a "Done:" note. Several plan branches tick neighbouring lines in roadmap.md, so merging them one after another can stop on a small conflict there; keep both sides' lines.
