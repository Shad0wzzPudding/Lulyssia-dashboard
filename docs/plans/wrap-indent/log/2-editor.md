# 2. The same inside the description editor

**Status:** Built
**Branch:** `plan/wrap-indent/2-editor` (based on item 1's branch, `plan/wrap-indent/1-shown-descriptions`)

## Done when
- [x] in the Task form, Tab on the first point of "Test tab behavior" makes its wrapped part line up under "- Able" straight away — browser check at 390px (local dev server, test data, nothing reaches the live project): opening the task, each "- " point's second row starts at 10 px (where its text starts); 60 ms after Tab on the first point, its second row starts at 34 px, where "Able" starts
- [x] the text saved after typing, Enter, Tab, Shift+Tab, Space, bullets, bold and undo is character-for-character what main saves for the same keys — one browser script (typing, Enter, an empty line, Tab / Shift+Tab, Space on two lines, bold with Ctrl+B, Auto • bullets with Tab, a paste of two lines, undo twice and redo, the Tab button on four lines, Ctrl+M and Tab, Backspace) run on the old editor and on this branch: the text after each of the 13 steps and the saved description are identical. Also run again: item 2's, 3's and 4's checks from plan home-and-editor (Tab, Shift+Tab, undo, Space rules, the Tab button on a computer and a phone), Ctrl+M, Auto • bullets keeping the indent, and Enter while a word is composed (the word is kept)
- [x] clicking and arrow keys put the caret where expected in wrapped rows, also at a line's start — browser check: a click at the start of a point's second row puts the caret before that row's first word; a click in the indent to its left, at the same row's start; a click at a line's left edge, before its bullet; Down then Home from line 1 goes to the start of line 2 (before its leading spaces); Up from the last line lands on the empty line; End on a wrapped row goes to the end of that row
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint src/components/ui/formatted-textarea.tsx`, `npm run build`

Also checked: Thai words composed (a simulated input method) at the end of an indented line and in its middle are kept, and saved exactly.

## Owner checks by eye
Typing and editing a long indented, bulleted description on a computer and a phone (including Thai).

## Assumptions
- The editor now draws each line as its own block (an empty line holds a line break so it keeps its height), and a line's lead sits in its own small wrapper, so its width can be measured; the code that reads the text and the caret back counts the blocks as line breaks, exactly as before. Nothing about the saved text changes.
- The indent is measured again after each change that redraws the editor, and when the box changes width or the font loads. While typing plain letters inside a line, the editor isn't redrawn (as before), so a line whose lead you're editing gets its new indent as soon as that change is drawn (straight away for Tab, Space, bullets and typing at the line's start).

## Needs
nothing

## Notes
- The test helpers for the editor were changed to read the text the way the editor does (blocks as line breaks) and run on both the old and new editor, so the two runs are measured the same way.
- Rounding: a measured indent can be up to 1 px off the text (seen once: 34 px against 35 px), which isn't visible.
