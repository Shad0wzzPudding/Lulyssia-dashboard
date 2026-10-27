# Plan: Home and description editor

**Status:** Draft <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `9abde7e` (27 Oct 2026)
**Decided with the owner on:** 27 Oct 2026 (in progress)

## Goal

Make Home and the description editor easier to use: a task or event that starts and ends on the same day
shows once instead of twice, tasks and events can be edited straight from Home, their pictures show in
Home's details, and whole lines of a description can be indented with Tab, Space or a Tab button.

Each item starts as "Not decided yet"; its decisions are written in as soon as the owner makes them, so
the plan can be picked up again at the first undecided item.

## Not in this plan

Anything beyond the six ideas below. New ideas that come up go to the roadmap's backlog.

## Items

Build them in this order. Each one is its own branch and can be merged on its own unless it says
"Depends on".

### 1. One entry for a task or event that starts and ends on the same day
- **Owner's idea:** ถ้า Task หรือ event เริ่ม และจบในวันเดียวกัน ให้ Merge ตอนแสดงในปฎิทิน และ Today
  event, task เลย (if a task or event starts and ends on the same day, merge it when shown in the calendar
  and in Today's events and tasks).
- **Found while planning:** such an item already shows only once in the calendar's day list and in the
  Today lists, but with its two times side by side (two time chips, two badges "Start"/"End" or
  "Starting"/"Deadline", or "Starts: … · Due: …").
- **Decision:** show one time range instead of the two times; keep the green/red side stripe.
- **Branch:** `plan/home-and-editor/1-same-day-range`
- **What it does:** a task or event whose start and end fall on the same day shows its time as one range,
  "09:00 – 13:00", in four places on Home: the calendar's day list, the calendar's details window, Today's
  Tasks and Today's Events.
- **Rules decided:**
  - calendar day list: the two time chips become one range chip, and the "Start" and "End"/"Due"
    badges for that item are dropped (the type badge "task"/"event" stays); the half-green, half-red
    side stripe stays exactly as now, as the sign that it starts and ends that day;
  - details window: the "Start:" and "End:"/"Due:" rows become one row "Time: 09:00 – 13:00";
  - Today's Tasks: the "Starting" and "Deadline" badges and "Starts: … · Due: …" become the range;
  - Today's Events: "Starts: …" and "Ends: …" become the range;
  - only items that start and end on the same day change; one that only starts or only ends that day
    keeps today's look; this also holds for days other than today in the calendar;
  - the range chip's colour follows preview option B (cyan); the exact style may use the app's
    existing chip classes.
- **Preview:** `previews/1-same-day.html`, option **B**, plus the side stripe from "Now". **Intent only:**
  use the app's real components and sizes.
- **Done when:**
  - [ ] a same-day task and a same-day event show "HH:mm – HH:mm" once in each of the four places, with
    no Start/End or Starting/Deadline badges
  - [ ] the calendar's day list keeps the half-green, half-red side stripe for them
  - [ ] an item that only starts or only ends that day looks as before in all four places
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** Home with a same-day task and event, today and on another calendar day.
- **Needs:** nothing
- **Depends on:** nothing

### 2. Tab on selected lines in the description editor
- **Owner's idea:** select lines and press Tab to indent the selected lines.
- **Decision:** as in the preview: Tab indents, Shift+Tab un-indents, Esc then Tab leaves the box.
- **Branch:** `plan/home-and-editor/2-tab-key`
- **What it does:** in the description editor (src/components/ui/formatted-textarea.tsx, used by the
  task, event and interest forms), Tab adds 6 spaces at the start of the caret's line, or of every line
  the selection touches; Shift+Tab removes up to 6 spaces from the start of each of those lines.
- **Rules decided:**
  - 1 tab = 6 plain spaces (not a tab character), so the description shows the same everywhere;
  - a selection that ends exactly at the start of a line doesn't take that line (as in the preview);
  - after Tab or Shift+Tab the same lines stay selected, shifted with the text, so Tab can be pressed
    again; with only a caret, the caret moves with its line;
  - Shift+Tab removes only spaces (up to 6 per line); a line with fewer removes what it has;
  - Esc, then Tab, leaves the box for the next field as Tab does today (keyboard users aren't trapped);
    clicking back in or typing anything else turns Tab back into indenting;
  - each Tab or Shift+Tab is one step for the editor's undo/redo (Ctrl/Cmd+Z);
  - the indent keeps the formatting of the text it moves (bold, italic, strikethrough, bullets);
  - leading spaces must survive saving and showing: the cards already show descriptions with their
    spaces (whitespace-pre-wrap); check the saved text keeps them.
- **Preview:** `previews/2-4-indent.html` (the Tab key part). **Intent only:** a plain text box; the real
  editor keeps its formatting.
- **Done when:**
  - [ ] Tab on a caret indents that line by 6 spaces; on a selection over 3 lines, all 3 get 6 spaces
  - [ ] Shift+Tab removes up to 6 spaces from each of those lines
  - [ ] after Tab, the same lines are still selected and a second Tab indents them again
  - [ ] Esc then Tab moves focus to the next field
  - [ ] Ctrl/Cmd+Z undoes one Tab at a time
  - [ ] a bold word on an indented line is still bold after saving and reopening
  - [ ] the saved description keeps the leading spaces, and the card shows them
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** indent a few lines of a task's description with Tab and Shift+Tab.
- **Needs:** nothing
- **Depends on:** nothing

### 3. Space on selected lines in the description editor
- **Owner's idea:** select lines and press Space to add a space at the start of the selected lines.
- **Decision:** as in the preview: Space on whole or multiple selected lines adds 1 space to each.
- **Branch:** `plan/home-and-editor/3-space-key`
- **What it does:** in the description editor, when the selection covers one whole line or runs over two
  or more lines, Space adds 1 space at the start of each of those lines instead of replacing the
  selected text. With part of one line selected, or no selection, Space types a space as usual.
- **Rules decided:**
  - "whole line": the selection starts at the line's start and ends at its end (the line break itself
    may or may not be included);
  - a selection that ends exactly at the start of a line doesn't take that line;
  - the same lines stay selected afterwards (shifted by one space each), so Space can be pressed again;
  - only plain Space: with Ctrl, Cmd or Alt held, Space behaves as it does now;
  - one step for undo/redo, and the formatting of the moved text is kept, as in item 2.
- **Preview:** `previews/2-4-indent.html` (the Space part). **Intent only.**
- **Done when:**
  - [ ] whole line selected + Space: that line gets 1 leading space and its text is still there
  - [ ] 3 lines selected (even partly) + Space: each gets 1 leading space
  - [ ] one word selected inside a line + Space: the word is replaced by a space, as before
  - [ ] the lines stay selected and a second Space adds another space to each
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** select some lines in a description and press Space.
- **Needs:** nothing
- **Depends on:** item 2 shares the "lines in the selection" logic; if item 2 isn't built first, build
  that part here and reuse it there.

### 4. A Tab button in the editor's toolbar
- **Owner's idea:** a Tab format button that indents the line; 1 tab = 6 spaces.
- **Decision:** one "⇥ Tab" button right after "• Add", doing what the Tab key does.
- **Branch:** `plan/home-and-editor/4-tab-button`
- **What it does:** the editor's toolbar gets a "⇥ Tab" button between "• Add" and the strikethrough
  button. Pressing it indents the caret's line, or every selected line, by 6 spaces, exactly like the
  Tab key in item 2 (useful on phones, which have no Tab key).
- **Rules decided:**
  - same look as the other toolbar buttons (slanted, outlined); title/tooltip "Indent the line (6
    spaces)" and a screen reader name;
  - pressing it keeps the editor's selection (the button doesn't take the selection away), so it can be
    pressed several times in a row;
  - if the caret was never placed in the editor, it indents the last line (like "• Add" adds at the end);
  - no "Untab" button: removing an indent is Shift+Tab or deleting the spaces.
- **Preview:** `previews/2-4-indent.html` (the toolbar). **Intent only:** use the toolbar's real button
  style; the "⇥" sign can be a matching icon from the icon set already used (lucide), e.g. IndentIncrease.
- **Done when:**
  - [ ] the button shows after "• Add" in the task, event and interest forms
  - [ ] pressing it with a caret indents that line by 6 spaces; with 3 lines selected, all 3
  - [ ] pressing it twice in a row indents twice (the selection stays)
  - [ ] it works on a phone-sized screen (tap)
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** the button in the toolbar on a computer and a phone.
- **Needs:** nothing
- **Depends on:** item 2 (it uses the same indent action)

### 5. Edit tasks and events from Home
- **Owner's idea:** a pencil icon right after a task's or event's name on Home opens its edit form.
- **Decision:** Not decided yet

### 6. Pictures in Home's details
- **Owner's idea:** when a task or event is clicked on Home, its pictures show with its information.
- **Decision:** Not decided yet

## Questions answered while planning

(Filled in as we go.)

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

Filled in as items are decided.
