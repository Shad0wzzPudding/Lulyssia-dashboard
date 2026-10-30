# Build summary: wrap-indent

Built on 30 Oct 2026 against `main` at `48da2b3`. Since the plan's `d26091b` only
`src/hooks/useEditorSettings.ts` had changed, which the plan doesn't touch, so every item was built as
written. All 3 items are **Built**. Each item's log, with how every "Done when" line was checked, is
in this folder.

## Items

| # | Item | Status | Branch | Based on |
| --- | --- | --- | --- | --- |
| 1 | Wrapped rows line up under the text on cards and Home | Built | `plan/wrap-indent/1-shown-descriptions` | main |
| 2 | The same inside the description editor | Built | `plan/wrap-indent/2-editor` | item 1 |
| 3 | The search bar takes several words and exclusions | Built | `plan/wrap-indent/3-search-filter` | main |

## Merge order

1 → 2 → 3 → this summary branch last. Item 2 needs item 1 (it shares its rule in
`src/lib/lineLead.ts`); item 3 can go in any time.

Tried: merging all three in this order into a local copy of `main` gave no conflicts, and the result
passes typecheck, lint (`eslint src`) and build. On it, the editor script gave the same text after
every step and the same saved description as the old editor, the search examples gave the preview's
items, and descriptions without indents had the same size everywhere as on `main`.

## Deploy checklist

Nothing to apply or deploy: no migration, no LINE function changes. Everything goes out with the
next Vercel deploy after merging.

## Assumptions and open questions (one at a time)

1. **Item 1:** each line's indent is measured on screen (exact for the real font) and kept up to date
   when the box's width changes or the font loads; for the first moment after a card appears, wrapped
   rows start at the left edge. A line made only of spaces gets no indent.
2. **Item 1 (plan detail):** the plan lists the calendar's day list and In progress among the places
   using the shared display; they don't. The day list shows a one-line preview (cut to one row) and In
   progress shows no description, so nothing changed there.
3. **Item 1:** bold and italic never run across a line break in this app (the format reader stops them
   at a line's end, as before); only ~~strike~~ can, and it shows on both lines.
4. **Item 2:** the editor now draws each line as its own block, with the lead in a small wrapper so its
   width can be measured; reading the text and the caret back counts the blocks as line breaks, so
   nothing saved changes. While you type plain letters inside a line the editor isn't redrawn (as
   before); Tab, Space, bullets and typing at a line's start redraw it straight away.
5. **Item 3:** the chips show the words to find first, with "or" between them, then the words to hide
   (the preview put "or" between every chip).
6. **Item 3:** screen readers hear the chip row as a sentence ("Showing items with lab but not draft",
   "Showing items without done").
7. **Item 3:** placeholders: "Search tasks… e.g. report, slides, !draft", "Search events… e.g.
   meeting, party, !online", "Search interests… e.g. music, books, !someday".
8. **Item 3:** chips show for any search with a comma or `!`, also inside quotes (`"!important"` shows
   one green chip "!important").

Nothing is blocked.

## Owner checks by eye

- **1:** a long, indented, bulleted description on a phone-width card and on Home.
- **2:** typing and editing a long indented, bulleted description on a computer and a phone (including
  Thai).
- **3:** a few searches on Tasks, Events and Interests, on a computer and a phone.

## Stopped early?

No: every item is built.
