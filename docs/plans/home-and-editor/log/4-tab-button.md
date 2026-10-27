# 4. A Tab button in the editor's toolbar

**Status:** Built
**Branch:** `plan/home-and-editor/4-tab-button` (based on item 2's branch, `plan/home-and-editor/2-tab-key`)

## Done when
- [x] the button shows after "• Add" in the task, event and interest forms — browser check (local dev server, test data): the toolbar reads Auto •, • Add, Tab, strikethrough, bold, italic in all three forms, on a computer and at 375px
- [x] pressing it with a caret indents that line by 6 spaces; with 3 lines selected, all 3 — browser check: caret in "two" → "      two"; a selection over "one … three" → each of the three lines got 6 more spaces, "four" untouched
- [x] pressing it twice in a row indents twice (the selection stays) — browser check: the second press added 6 more to the same three lines, and the editor kept the focus and selection
- [x] it works on a phone-sized screen (tap) — browser check at 375×740 with touch (Playwright `isMobile`, `hasTouch`, `tap()`): same results as on the computer; the toolbar fits on one row and the page is no wider than the screen
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint src/components/ui/formatted-textarea.tsx`, `npm run build`

Also checked: in each form, with the caret never placed in the editor, the button indents the last line ("a / b" → "a / ······b").

## Owner checks by eye
The button in the toolbar on a computer and a phone.

## Assumptions
- The button shows the lucide `IndentIncrease` icon and the word "Tab", in the toolbar's outlined button style (like "Auto •").
- Its screen reader name is the same as its tooltip, "Indent the line (6 spaces)".
- The button doesn't take the focus when pressed (so the selection and, on phones, the keyboard stay with the editor).

## Needs
nothing

## Notes
- Built on item 2's branch: it uses the same indent action as the Tab key. Merge item 2 first. Items 3 and 4 both change `src/components/ui/formatted-textarea.tsx` in different places; if git asks, keep both changes (item 3's Space block in the key handler and item 4's button and icon import; the `lineIndent` import line takes item 3's version).
