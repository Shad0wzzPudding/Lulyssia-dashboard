# 1. Wrapped rows line up under the text on cards and Home

**Status:** Built
**Branch:** `plan/wrap-indent/1-shown-descriptions` (based on `main`)

## Done when
- [x] on a narrow card, "Test tab behavior" with its first point indented shows the wrapped part of that point under "- Able", and every "- " point's wrapped rows start under its first word — browser check at 375px (local dev server, test data, nothing reaches the live project), measuring where each line's second row starts against where its text starts after the lead: on the Tasks card the indented point 34/34 px, each "- " point 10/10 px, the indented "•" point 35/35 px, a "12)" point 23/23 px; the same on Home's Today list (29, 9, 30, 20 px)
- [x] a bold or italic run across two lines still shows bold/italic on both lines — the format parser only lets ~~strike~~ run across a line break (bold and italic always stop at a line's end, as before): "~~struck across\ntwo lines~~" is struck on both lines; bold and italic on their own lines still show
- [x] a line starting `*word*` wraps as now (not treated as a bullet) — browser check: "*italic* line that is long…" gets no indent (its second row starts at the left edge), and "**bold** - not a bullet" has none either
- [x] every place that shows a description (Tasks, Events, Interests cards; Home's lists and details window) uses the new wrapping and nothing else in them moved — they all draw descriptions with the one shared `FormattedText`; with a description without indents (an empty line, a final line break, a long web address, bold/italic/strike) every place had exactly the same size on `main` and on this branch (Home's Today lists and Main Focus, the details window, the Tasks, Events and Interests cards, at 375px); selecting and copying a description gives exactly the same text as on `main`
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

## Owner checks by eye
A long, indented, bulleted description on a phone-width card and on Home.

## Assumptions
- The lead's width is measured on screen (so it matches the real font exactly) and kept up to date when the box's width changes or the font finishes loading. For the first moment after a card appears, before it's measured, wrapped rows start at the left edge, as now.
- A line made only of spaces gets no indent (nothing to line up).
- Each line is drawn as its own row; an empty line keeps its height, and a line break at the very end adds no extra row (as before).

## Needs
nothing

## Notes
- The plan lists the calendar's day list and In progress among the places using `FormattedText`; they don't: the day list shows a one-line preview of the description (cut to one row) and In progress shows no description, so they're unchanged.
- The lead rule is in `src/lib/lineLead.ts`, for item 2 to reuse.
