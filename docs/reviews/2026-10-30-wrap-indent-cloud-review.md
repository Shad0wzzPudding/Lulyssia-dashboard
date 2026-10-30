# Cloud review, 30 Oct 2026 (wrap-indent): rounds log

Branch `cloud-review-2026-10-30-wrap-indent`: `main` at `48da2b3` with the 4 `plan/wrap-indent/*`
branches merged in their order (1 → 3, then summary), since the build isn't on `main` yet. Merge those
branches first, then this one. Checks run on a local copy only: the app in a local browser with every
backend request answered by test data. Nothing reached the live project.

## Order of areas
Earlier runs: 27 Oct (all 15 areas), 27 Oct "home and editor" (areas 1–6, 9–12, 14, 15), 30 Oct
(review only, no rounds). Since then the build changed the editor (10), how descriptions are shown on
Home and the cards (1, 2, 3, 4), the search (7) and what phones and screen readers get (14);
`useEditorSettings.ts` changed on 30 Oct (5, 11). Areas 8 and 13 were last covered three runs ago, so
they're due too. Order: 10 Editor → 1 Home → 7 Select mode, search, sort and filters → 2 Tasks →
3 Events → 4 Interests → 11 Data hooks → 5 Settings → 14 Phone layouts and accessibility →
8 Recent Changes and undo → 13 Migrations, access rules and cron. Areas 6, 9, 12 and 15 haven't changed
since the "home and editor" run and count as covered.

## Phase 1
- Reviewed `23443fc` and `e240ea1` on `main`: no new finding (nothing else uses the removed
  push_subscriptions table; its migration drops it).
- Reviewed the build's commits (items 1–3): 1 fixed (`31c33bf`): in the windows, indents were measured
  during the opening zoom and came out a few pixels short. Also compared on the old and new editor:
  Backspace at a line's start and mid-line, Delete at a line's end, typing over a selection across
  lines, undo, cut across a line break, select all and type or Backspace (same text after every step,
  the placeholder comes back when emptied).

## Phase 2
