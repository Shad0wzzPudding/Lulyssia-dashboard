# 7. LINE keeps the indents

**Status:** Built
**Branch:** `plan/home-and-editor/7-line-keeps-indents` (based on `main`)

## Done when
- [x] `formatDetail("Bring:\n      laptop\n      charger")` returns those three lines with the six leading spaces kept — Node script (the function bundled with esbuild): `"Bring:\n      laptop\n      charger"`
- [x] `formatDetail("      indented first line")` keeps the leading spaces — same script: `"      indented first line"`
- [x] empty and spaces-only lines are still dropped, trailing spaces still trimmed, the 5-line and 300-character limits still apply — same script: `"a  \n\n   \n  **b**  \n\t\nc"` → `"a\n  b\nc"`; six lines → the first five and the "Read full detail in dashboard." note; a long indented text is cut near 300 characters with the note; spaces-only → nothing. On 50,000 random texts, the new result with each line's leading spaces taken off equals the old result whenever neither was cut (43,942 compared, 0 differences), and `stripMarkdown` (used elsewhere) gives exactly the same results as before
- [ ] `deno check` passes for send-line-daily, send-line-reminders and send-line-overdue (if Deno is available) — not verified: Deno isn't installed in this session and downloading it wasn't allowed. Checked instead: `npx tsc --noEmit --strict` on `_shared/lineText.ts` passes, and the three functions only call `formatDetail`, whose signature didn't change

## Owner checks by eye
After deploying, a LINE message for a task whose description has an indented line (e.g. "today" in LINE, or the Settings test button).

## Assumptions
- Tabs typed by hand count as spaces at the end of a line (trimmed) and at its start (kept), like spaces. The editor's own indents are plain spaces.
- Whether LINE itself shows leading spaces in its cards couldn't be checked here (nothing is sent from a build); that's the owner's check after deploying.

## Needs
Function deploy: `send-line-daily`, `send-line-reminders`, `send-line-overdue` (they share `_shared/lineText.ts`).

## Notes
- `stripMarkdown` still trims the whole text, as before, for its other uses; `formatDetail` now uses the same mark removal without that trim.
