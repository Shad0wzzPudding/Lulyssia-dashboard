# 2. Tab on selected lines in the description editor

**Status:** Built
**Branch:** `plan/home-and-editor/2-tab-key` (based on `main`)

## Done when
- [x] Tab on a caret indents that line by 6 spaces; on a selection over 3 lines, all 3 get 6 spaces — browser check (local dev server, test data, nothing reaches the live project) in the Tasks page's new-task form: "Bring: / laptop / charger / pens", caret in "lap|top" + Tab → only "laptop" gets 6 spaces and the caret stays after "lap"; a selection from "top" to "p" of "pens" + Tab → all three lines get 6 more spaces
- [x] Shift+Tab removes up to 6 spaces from each of those lines — browser check: lines with 18/12/12 spaces went to 12/6/6; a line with only 2 spaces lost just those 2
- [x] after Tab, the same lines are still selected and a second Tab indents them again — browser check: the selection still read "top … p" (shifted with the text), and a second Tab added 6 more to each of the three lines
- [x] Esc then Tab moves focus to the next field — browser check: focus moved from the description to the Start Date box, and the form stayed open; clicking back in, Tab indents again
- [x] Ctrl/Cmd+Z undoes one Tab at a time — browser check: three Ctrl+Z after Tab, Tab, Shift+Tab, Tab stepped back through each state one by one
- [x] a bold word on an indented line is still bold after saving and reopening — browser check: "charger" made bold, its line indented, Create; the card shows it bold and the Edit form shows it in bold again; also a script (esbuild + Node) on 20,000 random formatted texts: indenting then saving reads back the same characters and styles, and un-indenting gives back the original text and selection
- [x] the saved description keeps the leading spaces, and the card shows them — browser check: the saved description was "Bring:\n                  laptop\n                  **charger**\n            pens" and the card's text had the same spaces
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the two changed files, `npm run build`

## Owner checks by eye
Indent a few lines of a task's description with Tab and Shift+Tab.

## Assumptions
- **Esc no longer closes the form the first time when the description box has the focus.** The forms are windows that close on Esc, and they hear Esc before the box does, so without this "Esc, then Tab" would close the form instead of moving on. Now the first Esc in the description box only frees Tab; a second Esc closes the form as before. Esc anywhere else in the form (title, dates, …) closes it as before.
- Tab leaves the box once after Esc; leaving the box, clicking in it or typing any other key turns Tab back into indenting. Shift+Tab after Esc also moves (backwards) as usual.
- Ctrl/Cmd/Alt+Tab are left to the browser.

## Needs
nothing

## Notes
- The line logic is in the new `src/lib/lineIndent.ts`, for items 3 and 4 to reuse.
- While testing, typing right after Enter at robot speed (under one frame) dropped the line break. That's how the editor already worked before this plan (a person can't type that fast), so it's left as it is.
