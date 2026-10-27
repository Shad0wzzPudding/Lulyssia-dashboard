# 8. Editor setting: Quick space or Normal

**Status:** Built
**Branch:** `plan/home-and-editor/8-editor-setting` (based on item 3's branch, `plan/home-and-editor/3-space-key`, which is on item 2's)

## Done when
- [x] Settings shows the Editor card last, white, with Quick space selected for an account that never chose — browser check (local dev server, test data, nothing reaches the live project): the cards read Your nickname, LINE daily digest, Tag Management, Animating menu, Sound, Editor; the Editor card is inside `theme-light` (background rgb(245, 245, 245)); "Quick space" selected
- [x] choosing Normal saves to `user_preferences.prefs` without removing the saved sort choices (check prefs before and after) — before `{"sort":{"tasks":"title_asc","events":"user"},"names":{"first":"Lu"}}`, after `{… the same …,"editor":{"spaceIndent":"normal"}}`; back to Quick space → `"spaceIndent":"quick"`, the rest unchanged
- [x] with Normal, whole lines selected + Space replaces them with a space; with Quick space, item 3's behaviour — browser check: Normal, "three" selected + Space → the line became " "; two lines selected → replaced by one space; Tab still indents with Normal. Quick space: all of item 3's checks again with the same results
- [x] the choice is still there after a reload (and on another browser signed in to the same account) — browser check: after a reload Normal was still selected; a second, fresh browser using the same account data also showed Normal
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

## Owner checks by eye
The new card, and Space in a description with each choice.

## Assumptions
- The choice is a pair of radio options (the app's existing radio buttons), each with its one-line explanation; the card has a pen icon (lucide `PenLine`) like the other cards' icons.
- The saved choice is read once per visit and shared by every editor and the Settings card, so a change applies at once, also to an editor that's already open. A change made on another device shows after a reload.
- A choice made before the saved one has loaded wins (as with the sort choices).
- Card text: "Saved to your account, so it's the same on every device."

## Needs
nothing (no migration: it uses the existing `user_preferences.prefs` field)

## Notes
- Built on item 3's branch (it changes item 3's Space rule). Merge items 2 and 3 first.
