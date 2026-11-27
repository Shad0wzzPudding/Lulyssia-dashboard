# 2. The results rise in

**Status:** Built
**Branch:** `plan/calendar-search/2-rise` (on item 1's branch: merge `plan/calendar-search/1-search` first)

## Done when
- [x] the rows rise in at the moments above and not while typing more letters — checked in a
      browser (Playwright) by listing the running animations: when the results first show (8 rows
      incl. "Past", starting 0, 45, 90 … 315ms), after picking a result (that date's rows), after
      clicking a date while searching, and after "← Results"; nothing while typing or deleting
      letters, and nothing when a date is clicked without a search.
- [x] with reduced motion turned on, nothing moves — same moments with reduced motion on: no
      animation at all (the rule sits in the `prefers-reduced-motion: no-preference` block of
      `src/index.css`).
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on
      the changed files, `npm run build`.

## Owner checks by eye
- The Rise motion: each row fades in from 12px lower, 0.32s, 45ms after the one before it.

## Assumptions
- **Easing:** the preview's curve (`cubic-bezier(0.2, 0.8, 0.3, 1)`), since the plan takes the
  preview as exact for the timing.
- **Typing after a date is open:** that brings the results back, which counts as the results
  showing again, so they rise once (then not on further letters).
- **The panel's header** (the date or "Results for …") keeps its usual quick fade; only the rows
  rise, as the plan says.

## Needs
Nothing (front end only).

## Notes
- The rows only carry the animation for the moment it plays (about 0.3s plus 45ms a row), so a
  row that turns up later while typing doesn't rise on its own.
