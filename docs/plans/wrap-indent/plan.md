# Plan: Wrapped lines keep their indent

**Status:** Draft <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `aed71e7` (30 Oct 2026)
**Decided with the owner on:** 30 Oct 2026 (in progress)

## Goal

When a long line in a description wraps onto the next row, the wrapped part lines up under the line's
text, as in Word, instead of going back to the left edge. An indented line stays indented all the way
down, and a bullet ("- ", "• ", "1. ") stands out on its own with its text lined up beside it.

## Not in this plan

- LINE: LINE wraps a message itself, so a wrapped row there still starts at the left. Nothing changes
  in the LINE functions.
- Any change to the saved text: this is only how a description is drawn. No spaces or marks are added.

## Items

Build them in this order. Each one is its own branch and can be merged on its own unless it says
"Depends on".

### 1. Wrapped rows line up under the text on cards and Home

- **Owner's idea:** "the text editor is like a word, where the line that below won't tab or space while
  the first line do" (seen on the task "Test tab behavior" after Tab on its first point: the wrapped
  "line." went back to the left edge).
- **Decision:** preview option **B**: wrapped rows start under the text after the line's leading spaces
  and its bullet, like Word's hanging indent.
- **Branch:** `plan/wrap-indent/1-shown-descriptions`
- **What it does:** wherever a description is shown (not edited), a line that wraps continues under
  its own text:
  - a line starting with spaces: wrapped rows start after those spaces;
  - a line starting with a bullet, with or without spaces before it: wrapped rows start under the
    first word after the bullet;
  - any other line: as now.
  The shared display component `src/components/ui/formatted-text.tsx` (`FormattedText`) is used by
  the Tasks, Events and Interests cards, the Interests page and Home (Today lists, calendar day list,
  details window, In progress, Upcoming), so changing it covers them all; check each place still looks
  right.
- **Rules decided:**
  - a line's "lead" is its leading spaces, then optionally a bullet: `-`, `•`, `*`, or a number
    followed by `.` or `)` (e.g. `1.`, `12)`), followed by at least one space. The wrapped rows start at
    the drawn width of that lead (e.g. CSS `padding-left` equal to the lead's width with a matching
    negative `text-indent`, measured or approximated so it lines up with the real font);
  - `**bold**`, `*italic*` and `~~strike~~` keep working, including formatting that runs across a line
    break (the display must split into lines without breaking the format parser's segments). A line
    starting `*word*` (italic) is not a bullet: a bullet needs a space right after it;
  - a lead wider than half the box is capped at half the box, so the text always keeps room
    (Claude's default while planning; the owner can change it at review);
  - empty lines keep their height; long words still break (`[overflow-wrap:anywhere]` stays);
  - the text saved, copied and sent to LINE is unchanged.
- **Preview:** `previews/1-wrap-indent.html` (published at
  https://claude.ai/artifact/MtWc6F3wqWAX9Mg1muUDeS), option **B**. **Intent only:** use the app's
  fonts and components; the guides in the preview are not part of the design.
- **Done when:**
  - [ ] on a narrow card, "Test tab behavior" with its first point indented shows the wrapped part of
    that point under "- Able", and every "- " point's wrapped rows start under its first word
  - [ ] a bold or italic run across two lines still shows bold/italic on both lines
  - [ ] a line starting `*word*` wraps as now (not treated as a bullet)
  - [ ] every place that shows a description (Tasks, Events, Interests cards; Home's lists and details
    window) uses the new wrapping and nothing else in them moved
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** a long, indented, bulleted description on a phone-width card and on Home.
- **Needs:** nothing
- **Depends on:** nothing

### 2. The same inside the description editor

- **Branch:** `plan/wrap-indent/2-editor`
- **What it does:** while typing in the description editor (task, event and interest forms), wrapped
  rows line up exactly as in item 1, and update as you type, Tab, Shift+Tab, Space or add a bullet.
- **Rules decided:**
  - the same lead rule and half-box cap as item 1, so a description looks the same while editing as on
    its card;
  - only how it's drawn changes: everything the editor does today must keep working exactly as now:
    typing, the caret and selection (including arrow keys and clicking in a wrapped row), Enter and
    Auto •, Tab / Shift+Tab / Space on lines and Ctrl+M, the ⇥ Tab button, bold/italic/strike, undo
    and redo, copy and paste, and phone keyboards / Thai input that compose words;
  - the editor currently draws lines with `<br>` (`toHTML` in `src/components/ui/formatted-textarea.tsx`)
    and reads text and caret positions back from the page (`domChars`, `saveCursor`,
    `restoreSelection`); if drawing each line as its own block is needed, those must be updated
    together so the text read back is identical.
- **Preview:** same as item 1, option **B**. **Intent only.**
- **Done when:**
  - [ ] in the Task form, Tab on the first point of "Test tab behavior" makes its wrapped part line up
    under "- Able" straight away
  - [ ] the text saved after typing, Enter, Tab, Shift+Tab, Space, bullets, bold and undo is
    character-for-character what main saves for the same keys
  - [ ] clicking and arrow keys put the caret where expected in wrapped rows, also at a line's start
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** typing and editing a long indented, bulleted description on a computer and a
  phone (including Thai).
- **Needs:** nothing
- **Depends on:** item 1 (shares its lead rule; put the rule in one place, e.g. `src/lib/`)

## Questions answered while planning

- **Q:** Where should wrapped rows start? **A:** Option B: under the text after the leading spaces and
  the bullet, like Word.

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

Nothing to deploy or migrate: both items go out with the next Vercel deploy after merging.
