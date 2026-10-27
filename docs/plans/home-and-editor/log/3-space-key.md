# 3. Space on selected lines in the description editor

**Status:** Built
**Branch:** `plan/home-and-editor/3-space-key` (based on item 2's branch, `plan/home-and-editor/2-tab-key`)

## Done when
- [x] whole line selected + Space: that line gets 1 leading space and its text is still there — browser check (local dev server, test data) in the new-task form with "one two / three / four / five": "three" selected → " three"; the same with its line break selected → " three"
- [x] 3 lines selected (even partly) + Space: each gets 1 leading space — browser check: from "two" to "fo" of "four" → " one two / three / four" each got one space, "five" untouched
- [x] one word selected inside a line + Space: the word is replaced by a space, as before — browser check: "two" selected + Space → "one  " (the word became a space)
- [x] the lines stay selected and a second Space adds another space to each — browser check: after the first Space the selection was still " three" (and "two … fo" for 3 lines); a second Space gave "  three" (and two spaces on each of the 3 lines)
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

## Owner checks by eye
Select some lines in a description and press Space.

## Assumptions
- With Ctrl, Cmd or Alt held, Space is left to the browser (checked: Ctrl+Space with 3 lines selected changed nothing).
- After Space on one whole line, the selection includes the new space (" three"), so it still counts as the whole line and Space can be pressed again; for a partial selection over several lines it shifts with the text. Tab (item 2) does the same.

## Needs
nothing

## Notes
- Built on item 2's branch: it reuses item 2's line logic (`src/lib/lineIndent.ts`, which gets `isWholeLine` here). Merge item 2 first.
- One step for undo and the formatting kept: Space uses the same edit path as Tab (item 2's checks and its random-text script cover it).
