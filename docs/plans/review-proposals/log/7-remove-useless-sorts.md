# 7. Two sort choices that do nothing

**Status:** Built
**Branch:** `plan/review-proposals/7-remove-useless-sorts` (based on `main`)

## Done when
- [x] neither choice appears in any sort menu — browser check: the Tasks, Interests and Events menus list Newest first, Oldest first, Deadline/Start time (soonest), (latest), Title A–Z, Title Z–A, By tag, User sort, nothing else
- [x] with `pinned_first` or `completed_last` saved as the sort, the page opens sorted by deadline and the menu shows "Deadline (soonest)" — browser check with `{tasks: 'completed_last', interests: 'pinned_first'}` saved in `user_preferences`: both pages open with "Deadline (soonest)"
- [x] the other sorts work as before on Tasks, Events and Interests — their code is unchanged (only the two removed cases left `sortItems`); in the same test a saved `title_asc` on Events still opened as "Title A–Z", sorted by title
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

## Owner checks by eye
The sort menus on Tasks and Interests.

## Assumptions
none

## Needs
nothing

## Notes
- The saved value is left as it is in `user_preferences` and simply ignored until another sort is picked (as the plan allows).
- `SortAndFilterBar`'s `showPinned` and `showCompleted` options and the two cases in `src/lib/sortAndFilter.ts` are gone; the list of sorts now lives in one array there, which `useSortPreference` also uses to check a saved sort.
