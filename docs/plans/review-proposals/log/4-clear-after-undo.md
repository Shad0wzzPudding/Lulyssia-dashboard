# 4. Double-click on "Undo Clear" opens "Clear" again

**Status:** Built
**Branch:** `plan/review-proposals/4-clear-after-undo` (based on `main`)

## Done when
- [x] right after Undo, the Clear button can't be seen or clicked for about one second, on both pages — browser check (test data): Clear Completed (Tasks) / Clear Past (Events) → confirm → double click on "Undo Clear": 150ms later the Clear button has opacity 0, takes no clicks and is out of the Tab order, and no "Clear …?" question opened
- [x] after that it appears in its usual place and works — 1.45s after the double click: opacity 1, clickable, and a click opens the question, on both pages
- [x] the other buttons in that row don't move when it hides or appears — the Select button's position was the same before the Undo, while Clear was hidden and after it appeared (moved by 0px), on both pages
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

## Owner checks by eye
Clear Completed → Undo on Tasks (and Clear Past → Undo on Events), including a quick double click on Undo.

## Assumptions
- Hidden for 1 second, then a 0.3-second fade in.
- While hidden the button is also hidden from screen readers and skipped by Tab, so a keyboard can't reach it either.
- If the restored items haven't reloaded yet when the second is over, the button shows as soon as they are back, as before.

## Needs
nothing

## Notes
A small shared hook, `src/hooks/useBriefHold.ts`, holds the one-second flag for both pages.
