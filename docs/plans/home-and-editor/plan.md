# Plan: Home and description editor

**Status:** Draft <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `9abde7e` (27 Oct 2026)
**Decided with the owner on:** 27 Oct 2026 (in progress)
**Summary:** `summary.html`: the whole build at a glance, now → after for every item (published at
https://claude.ai/artifact/6dpfV2yy9tw5gaLXYCDUVb). **Intent only**, like the previews.

## Goal

Make Home and the description editor easier to use: a task or event that starts and ends on the same day
shows one time range, tasks and events can be edited straight from Home, their pictures show in Home's
details, and whole lines of a description can be indented with Tab, Space or a Tab button. LINE keeps
those indents, and a Settings choice turns Space's indenting off for anyone who prefers it.

Each item starts as "Not decided yet"; its decisions are written in as soon as the owner makes them, so
the plan can be picked up again at the first undecided item.

## Not in this plan

Anything beyond the items below (six from the owner, two added while planning). New ideas that come up go to the roadmap's backlog.

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
- **Decision:** show one time range instead of the two times, with a badge "Start and end today"
  beside the type badge; keep the green/red side stripe.
- **Branch:** `plan/home-and-editor/1-same-day-range`
- **What it does:** a task or event whose start and end fall on the same day shows its time as one range,
  "09:00 – 13:00", in four places on Home: the calendar's day list, the calendar's details window, Today's
  Tasks and Today's Events.
- **Rules decided:**
  - calendar day list: the two time chips become one range chip, and the "Start" and "End"/"Due"
    badges for that item are replaced by one badge "Start and end today" right after the type badge
    "task"/"event" (an outlined badge in the style of today's "Start" badge); the half-green, half-red
    side stripe stays exactly as now, as the sign that it starts and ends that day;
  - details window: the "Start:" and "End:"/"Due:" rows become one row "Time: 09:00 – 13:00";
  - details window: the same "Start and end today" badge after the type badge in the title;
  - Today's Tasks: the "Starting" and "Deadline" badges become "Start and end today", and
    "Starts: … · Due: …" becomes the range;
  - Today's Events: the "Start and end today" badge after the name, and "Starts: …" / "Ends: …" become
    the range;
  - on a calendar day other than today the badge reads "Start and end same day" (Claude's choice while
    planning, since "today" would be wrong there; the owner can change it at review);
  - only items that start and end on the same day change; one that only starts or only ends that day
    keeps today's look; this also holds for days other than today in the calendar;
  - the range chip's colour follows preview option B (cyan); the exact style may use the app's
    existing chip classes.
- **Preview:** `previews/1-same-day.html`, option **B**, plus the side stripe from "Now" and the badge
  from the summary page (`summary.html`, item 1). **Intent only:** use the app's real components and sizes.
- **Done when:**
  - [ ] a same-day task and a same-day event show "HH:mm – HH:mm" once and the badge "Start and end
    today" in each of the four places, with no Start/End or Starting/Deadline badges
  - [ ] on another calendar day the badge reads "Start and end same day"
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
- **Setting (added later):** item 8 adds an account setting that can turn this off ("Normal"); this item
  is the "Quick space" behaviour, which stays the default.

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
- **Decision:** the edit form opens right on Home (no page change); the pencil is in every place on Home
  that shows a task or event.
- **Branch:** `plan/home-and-editor/5-edit-from-home`
- **What it does:** a small pencil button right after the name of each task and event on Home opens the
  same edit form the Tasks or Events page uses, on top of Home. Update saves and closes it; Cancel closes
  it; either way you stay on Home, and Home shows the change.
- **Where:** Today's Tasks, Today's Events, the "In progress..." cards, the Upcoming Events list (and
  any tasks it shows), the calendar's day list, and the calendar's details window (next to its title).
- **Rules decided:**
  - the forms are moved out of TasksPage.tsx and EventsPage.tsx into shared components (for example
    `TaskFormDialog` and `EventFormDialog`) that both pages and Home use, so there is one form per kind
    and everything the forms do now keeps working the same: the date checks (no deadline before the
    start), "Saving…" and keeping the text when a save fails, offline refusal, attachments and the
    upload wait, tags, repeating tasks, "Notice before", sounds;
  - the Tasks and Events pages must look and behave exactly as before after the move;
  - the pencil's click only opens the form: it doesn't also open the details window or do what clicking
    the item does (In progress and the calendar's day list open the details window when the item
    itself is clicked; that stays);
  - in the calendar's details window, the pencil closes the details window and opens the form;
  - pencil look: a small icon button (lucide Pencil or the Edit icon the pages already use), muted
    until hovered, with the name "Edit task" / "Edit event" for screen readers and as a tooltip; it
    sits right after the name and wraps with it on narrow screens;
  - Home's interests (Main Focus) are not part of this item;
  - completed tasks aren't listed on Home, so nothing changes for them.
- **Preview:** none needed for the form (it's the existing one). The pencil's place is shown in
  `previews/6-details.html` (see item 6). **Intent only.**
- **Done when:**
  - [ ] each of the six places shows a pencil after a task's or event's name
  - [ ] clicking it opens that item's edit form on Home, filled in; saving changes the item and Home
    shows the new value without a reload; Cancel changes nothing; the page stays Home
  - [ ] clicking the pencil in In progress or the calendar's day list doesn't open the details window
  - [ ] the Tasks and Events pages' own add, edit and copy forms work as before (same checks as before:
    dates, saving, offline, attachments, tags, repeat, notice)
  - [ ] keyboard: the pencil can be reached with Tab and opened with Enter
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** edit a task and an event from Home (from Today's lists and from the
  calendar), and edit one on the Tasks page to see it's unchanged.
- **Needs:** nothing
- **Depends on:** nothing. This is the biggest item; if item 1 or item 6 is built first, keep their
  changes when editing HomePage.tsx.

### 6. Pictures in Home's details
- **Owner's idea:** when a task or event is clicked on Home, its pictures show with its information.
- **Decision:** option A: the details window shows the item's attachments exactly as its card does.
- **Branch:** `plan/home-and-editor/6-details-pictures`
- **What it does:** the window that opens when a task or event is clicked on Home (the calendar's day
  list, the calendar's details, the "In progress..." cards) shows, under the description, the pictures
  the item's card shows (the ones with the eye toggle on) and then every attachment as a chip, the same
  as on its Tasks or Events card. Tapping a picture or chip opens it.
- **Rules decided:**
  - reuse the cards' existing components (`AttachmentsImages` and `AttachmentsChips` in
    src/components/dashboard/AttachmentsField.tsx), so the look, the link renewal, the HEIC conversion
    and the opening behaviour are the same as on the cards;
  - the window gets the attachments from the task or event itself (today it only receives the title,
    times and description), so the item passed to it needs its attachments too (from the calendar's
    day list and from In progress);
  - an item with no attachments looks as now;
  - order inside the window: title, description, pictures, file chips, then the time row;
  - the window may need to scroll on a phone when there are big pictures; it must not grow wider than
    the screen.
- **Preview:** `previews/6-details.html`, option **A**. **Intent only:** use the real components.
- **Done when:**
  - [ ] an event and a task with a shown picture and a PDF: the details window shows the picture and both
    chips, from the calendar's day list and from In progress
  - [ ] a picture hidden from the card (eye off) isn't shown as a picture in the window, only as a chip
  - [ ] tapping the picture opens it; tapping the PDF chip opens the PDF
  - [ ] an item without attachments shows the window as before
  - [ ] at 375px the window fits the screen and scrolls if needed
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** open a task with a photo from Home's calendar and from In progress.
- **Needs:** nothing
- **Depends on:** nothing (item 5 also edits this window: keep both changes)

### 7. LINE keeps the indents (added while planning)
- **Why:** LINE messages trim the start of every description line, so indents made with items 2–4 would
  only show in the app.
- **Decision:** LINE keeps each line's leading spaces.
- **Branch:** `plan/home-and-editor/7-line-keeps-indents`
- **What it does:** descriptions in LINE messages (the morning letter, the day-before notice, the
  starting-soon card and the missed-deadline nudges, through `formatDetail` in
  supabase/functions/_shared/lineText.ts) keep the spaces at the start of each line.
- **Rules decided:**
  - only the start of lines changes: trailing spaces are still trimmed, empty (or spaces-only) lines are
    still dropped, and the 5-line / ~300-character limit and its "Read full detail in dashboard." note
    stay as they are;
  - the first line keeps its indent too (today the whole text is trimmed before it is split into lines);
  - the plain-text versions of the cards use the same `formatDetail`, so they follow.
- **Done when:**
  - [ ] `formatDetail("Bring:\n      laptop\n      charger")` returns those three lines with the six
    leading spaces kept (checked with a small script under Deno or Node)
  - [ ] `formatDetail("      indented first line")` keeps the leading spaces
  - [ ] empty and spaces-only lines are still dropped, trailing spaces still trimmed, the 5-line and
    300-character limits still apply
  - [ ] `deno check` passes for send-line-daily, send-line-reminders and send-line-overdue (if Deno is
    available)
- **Owner checks by eye:** after deploying, a LINE message for a task whose description has an indented
  line (e.g. "today" in LINE, or the Settings test button).
- **Needs:** function deploy: `send-line-daily`, `send-line-reminders`, `send-line-overdue`.
- **Depends on:** nothing (it works with indents typed by hand too)

### 8. Editor setting: Quick space or Normal (added while planning)
- **Owner's idea:** a setting for what Space does with text selected: "Quick space" (default: add one
  space to the selected lines, item 3) or "Normal" (Space replaces the selected text, as in other
  editors).
- **Decision:** a new "Editor" card in Settings, saved to the account so it follows the owner to every
  device; Quick space keeps item 3's rule (whole lines or 2+ lines only).
- **Branch:** `plan/home-and-editor/8-editor-setting`
- **What it does:** Settings gets a new card, "Editor", at the end (after Sound), with one choice,
  "Space with lines selected":
  - **Quick space** (default): item 3's behaviour: whole lines or 2+ selected lines get one space at
    their start; part of one line selected is replaced as usual;
  - **Normal**: Space always replaces the selected text, as before item 3.
- **Rules decided:**
  - saved in the account, in `user_preferences.prefs` (the JSON field that already holds the sort
    choices, see src/hooks/useSortPreference.ts), e.g. `prefs.editor.spaceIndent = "quick" | "normal"`;
    no migration: read and write it the way useSortPreference does (read prefs, change one key, upsert),
    keeping every other key in prefs;
  - a missing or unknown value means Quick space;
  - the editor reads the setting when it opens; changing it in Settings applies to editors opened after
    that (and to an open one if that's simple);
  - Tab, Shift+Tab and the Tab button (items 2 and 4) are not affected by this setting;
  - card colour: white (`theme-light`), so Settings keeps alternating black and white (Name black,
    LINE white, Tags black, Animating menu white, Sound black, Editor white); the choice is a pair of
    radio options or a switch with a one-line explanation of each, in the style of the other cards;
  - card text says it's saved to the account (the Animating menu and Sound cards say "this device").
- **Done when:**
  - [ ] Settings shows the Editor card last, white, with Quick space selected for an account that never
    chose
  - [ ] choosing Normal saves to `user_preferences.prefs` without removing the saved sort choices (check
    prefs before and after)
  - [ ] with Normal, whole lines selected + Space replaces them with a space; with Quick space, item 3's
    behaviour
  - [ ] the choice is still there after a reload (and on another browser signed in to the same account)
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** the new card, and Space in a description with each choice.
- **Needs:** nothing (no migration: it uses the existing prefs field)
- **Depends on:** item 3

## Questions answered while planning

- **Q:** Can Space's indenting be turned off? **A:** Yes, item 8: a "Quick space" / "Normal" choice in a
  new Editor card in Settings, saved to the account; Quick space is the default.
- **Q:** Do indents show in LINE? **A:** Not until item 7; LINE trimmed each line. The owner chose to
  keep them (item 7).
- **Q:** Should a same-day item still be marked as one? **A:** Yes (asked after the summary): a badge
  "Start and end today" after the type badge, with the range (item 1).

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

1. After merging item 7: deploy `send-line-daily`, `send-line-reminders` and `send-line-overdue`.
2. Nothing else: no migration (item 8 uses the existing `user_preferences.prefs` field), and the other
   items go out with the next Vercel deploy after merging.
