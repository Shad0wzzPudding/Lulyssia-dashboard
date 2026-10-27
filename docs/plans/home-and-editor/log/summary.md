# Build summary: home-and-editor

Built on 27 Oct 2026 against `main` at `5e4f2a9`. Since the plan's `9abde7e` only the plan itself had
changed, so every item was built as written. All 8 items are **Built**. Each item's log, with how
every "Done when" line was checked, is in this folder.

## Items

| # | Item | Status | Branch | Based on |
| --- | --- | --- | --- | --- |
| 1 | One time range for a same-day task or event | Built | `plan/home-and-editor/1-same-day-range` | main |
| 2 | Tab / Shift+Tab on selected lines | Built | `plan/home-and-editor/2-tab-key` | main |
| 3 | Space on selected lines | Built | `plan/home-and-editor/3-space-key` | item 2 |
| 4 | Tab button in the editor's toolbar | Built | `plan/home-and-editor/4-tab-button` | item 2 |
| 5 | Edit tasks and events from Home | Built | `plan/home-and-editor/5-edit-from-home` | main, with item 1 merged in |
| 6 | Pictures in Home's details | Built | `plan/home-and-editor/6-details-pictures` | main, with item 5 (and so item 1) merged in |
| 7 | LINE keeps the indents | Built | `plan/home-and-editor/7-line-keeps-indents` | main |
| 8 | Editor setting: Quick space or Normal | Built | `plan/home-and-editor/8-editor-setting` | item 3 |

Why some branches carry others:
- **3 and 4 on 2:** they reuse item 2's line logic (`src/lib/lineIndent.ts`) and editor code.
- **8 on 3:** it switches item 3's Space rule on and off.
- **5 has 1 merged in, 6 has 5 merged in:** the plan asks item 5 to keep item 1's Home changes and
  item 6 to keep item 5's. All three rewrite the same lines of HomePage.tsx, so they wouldn't have
  merged by themselves; each later branch takes in the earlier one with the conflicts resolved by hand,
  and the earlier items' checks were run again on it. The catch: item 5 can't go in without item 1,
  and item 6 can't go in without items 1 and 5.

## Merge order

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → this summary branch last.

Needed: 2 before 3 and 4; 3 before 8; 1 before 5; 5 before 6. Item 7 can go anywhere.

This was tried: merging every branch in this order into a local copy of `main` gave no conflicts
at all, and the result passes typecheck, lint (`eslint src` and the LINE file) and build. Every
item's browser checks were run again on that result and passed, and the Tasks and Events pages'
form check gave the same 29 results as on `main`.

## Deploy checklist

1. After merging item 7 (`plan/home-and-editor/7-line-keeps-indents`): deploy the functions
   `send-line-daily`, `send-line-reminders` and `send-line-overdue`.
2. Nothing else: no migration (item 8 uses the existing `user_preferences.prefs` field). The site
   changes go out with the next Vercel deploy after merging.

## Assumptions and open questions (one at a time)

1. **Item 2 (worth a look):** the first Esc in the description box no longer closes the form; it only
   frees Tab to move on to the next field. A second Esc closes the form as before, and Esc anywhere
   else in the form (title, dates, …) closes it as before. Without this, "Esc, then Tab" would close
   the form, because the forms hear Esc before the box does.
2. **Item 2:** after Esc, Tab leaves once; leaving the box, clicking in it or typing any other key turns
   Tab back into indenting. Shift+Tab after Esc moves backwards as usual. Ctrl/Cmd/Alt+Tab are left to
   the browser.
3. **Item 3:** with Ctrl, Cmd or Alt held, Space is left to the browser. After Space on one whole line,
   the selection includes the new space, so it still counts as the whole line and Space can be pressed
   again (Tab does the same).
4. **Item 1:** the range chip (calendar list) and the "Time:" label (details window) use the app's cyan;
   in Today's Tasks and Events the range is plain grey text where "Starts: … · Due: …" was. In Today's
   lists the "Start and end today" badge sits right after the name (those cards have no type badge).
5. **Item 4:** the button shows the lucide `IndentIncrease` icon and the word "Tab"; its screen reader
   name is its tooltip, "Indent the line (6 spaces)"; it doesn't take the focus when pressed.
6. **Item 5 (worth a look):** the In progress cards are no longer buttons but clickable cards that act
   like buttons (Tab reaches them, Enter or Space opens the details), because a button can't hold the
   pencil button. They look the same, plus a focus ring when reached with Tab.
7. **Item 5:** the pencil is a 20 px button with a 12 px lucide `Pencil`, grey until hovered, placed
   inside the name so it wraps with the last word. Pencils inside a "+N more" list also work (the form
   opens on top of that list).
8. **Item 6:** pictures and chips sit together under the description with no heading of their own; the
   window's size didn't need changing (the app's dialogs already stop at 92% of the screen and scroll).
9. **Item 7:** tabs typed by hand are treated like spaces (kept at a line's start, trimmed at its end).
   Whether LINE's cards themselves show leading spaces can only be seen after deploying.
10. **Item 8:** two radio options, each with a one-line explanation, and a pen icon (lucide `PenLine`).
    The saved choice is read once per visit and shared by every editor, so a change applies at once,
    even to an editor already open; a change made on another device shows after a reload. Card text:
    "Saved to your account, so it's the same on every device."

No item is blocked, and no question was left that changes what an item is.

## Not verified

- **Item 7:** `deno check` on the three LINE functions: Deno isn't installed in this session and
  downloading it wasn't allowed. Instead, the changed file passes `tsc --strict` on its own, and the
  functions only call `formatDetail`, whose signature didn't change.

## Owner checks by eye

- **1:** Home with a same-day task and event, today and on another calendar day.
- **2:** indent a few lines of a task's description with Tab and Shift+Tab; Esc then Tab in a form.
- **3:** select some lines in a description and press Space.
- **4:** the Tab button in the toolbar on a computer and a phone.
- **5:** edit a task and an event from Home (from Today's lists and from the calendar), and edit one on
  the Tasks page to see it's unchanged; the pencil's look on a computer and a phone.
- **6:** open a task with a photo from Home's calendar and from In progress.
- **7:** after deploying, a LINE message for a task whose description has an indented line (e.g.
  "today" in LINE, or the Settings test button).
- **8:** the new Editor card, and Space in a description with each choice.

## Stopped early?

No: every item is built.
