# 3. The search bar takes several words and exclusions

**Status:** Built
**Branch:** `plan/wrap-indent/3-search-filter` (based on `main`)

## Done when
- [x] chips show for `lab, !draft` and not for `lab` — browser check (local dev server, test data, nothing reaches the live project) on the Tasks page, on a computer and at 360px: `lab, !draft` shows a green "lab" and a red, crossed-out "draft"; `lab` and `report slides` show no chips
- [x] the examples in the preview's "Try" row give the same items on the Tasks page as in the preview — browser check with the preview's 8 sample tasks: `report, slides`, `!done`, `lab, !draft`, `report slides` and `"!important"` each showed exactly the tasks the preview's own rule picks (also `lab`)
- [x] a search without commas, `!` or quotes gives the same results as on main (unit-test `searchItems` or check in the browser) — script (esbuild + Node): the old and new `searchItems` on 30,000 random lists and searches made of letters, spaces, `*`, `~` and `\` gave identical results; each rule in the plan was also checked one by one (empty parts and a lone `!` ignored, quotes keeping a comma or `!`, spaces around parts ignored)
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

Also checked: in select mode, "All" with `lab, slides` picked the 3 shown tasks, and adding `!final` unpicked the hidden one (2 left), as before; the page is no wider than a 360px screen with chips showing.

## Owner checks by eye
A few searches on Tasks, Events and Interests, on a computer and a phone.

## Assumptions
- The chips show the words to find first, with "or" between them, then the words to hide (red, crossed out), rather than in the typed order. The preview put "or" between every chip, including the hidden words; the plan says "or" goes between words to find.
- Screen readers hear the row as a sentence, e.g. "Showing items with lab but not draft", or "Showing items without done" for hiding only. The chips themselves show just the words.
- Placeholders: "Search tasks… e.g. report, slides, !draft", "Search events… e.g. meeting, party, !online", "Search interests… e.g. music, books, !someday".
- The chips appear whenever the search has a comma or a `!` (also inside quotes, e.g. `"!important"` shows one green chip "!important"), as the plan's rule reads.

## Needs
nothing

## Notes
- The matching rule is still the one shared function (`searchItems` in `src/lib/sortAndFilter.ts`, with the new `parseSearch`), so the tag filter, sort, unpicking hidden items, "Show more" and the Tasks page's deferred search are unchanged.
