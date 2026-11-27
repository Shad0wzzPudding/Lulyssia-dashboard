# calendar-search: build summary

Built 2026-11-27 against `main` at `221dabc` (no code had changed since the plan's `76a1ea8`; only
plan documents).

## Items

| # | Item | Status | Branch |
|---|------|--------|--------|
| 1 | Search, results and jump | Built | `plan/calendar-search/1-search` (from `main`) |
| 2 | The results rise in | Built | `plan/calendar-search/2-rise` (on item 1's branch) |

Every "Done when" line was checked in a browser on a test page with made-up tasks and events (Thai
time, today set to 27 Nov 2026), plus typecheck, lint and build. Details in `1-search.md` and
`2-rise.md`.

## Merge order
1. `plan/calendar-search/1-search`
2. `plan/calendar-search/2-rise` (built on top of item 1)
3. `plan/calendar-search/summary` (this summary)

## Deploy checklist
- [x] Nothing to apply or deploy: front end only, goes out with Vercel when merged. No migrations, no
      functions.

## Assumptions to go through
1. **Narrow rows (item 1):** on phones, when a row has no room for its title and dates side by side,
   the dates move under the title (still on the right), so nothing widens the page.
2. **"Start and end" colour (item 1):** the single same-day date line is in the app's blue, like the
   same-day badge, since it is both green and red.
3. **"← Results" with no date selected (item 1):** at the top left of the "Select a Date" panel.
4. **Highlights note (item 1):** "Highlighted: dates with a match" replaces the line under the
   calendar; the 💡 hint inside "Select a Date" stays the same.
5. **Tab order on wide screens (item 1):** the search shows above the calendar but comes after it
   when tabbing (calendar → search → results).
6. **Easing (item 2):** the preview's curve.
7. **Typing after a date is open (item 2):** the results come back and rise once.
8. **Header (item 2):** the panel's header keeps its usual quick fade; only the rows rise.

No item was blocked.

## Owner checks by eye
- The search's place: desktop above the calendar; phone and tablet under it, right above the panel.
- The results panel and its chips ("Results for" then the green/red chips for a search with a comma
  or "!").
- The result rows and their dates (green start, red due/end, "Start and end …" for same-day items),
  the faded "Past" rows.
- "← Results" next to the `+ / −`.
- On narrow phones, a row's dates under its title.
- The Rise motion.

Next step: merge the branches in the order above, then run `/cloud-review`.
