# Plan: Today sections with tabs, and checklists in descriptions

**Status:** Ready to build <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `3359d35` (31 Oct 2026)
**Decided with the owner on:** 31 Oct 2026
**Summary:** `summary.html`: the whole build at a glance, now → after for every item (published at
https://claude.ai/artifact/8fcSsPpF1YCy5d54QtTR3v). **Intent only**, like the previews.

## Goal

The Tasks page gets a Today's Tasks section like the Events page's Today's Events, and both Today
sections show everything that starts or ends today, with tabs to see all of it, what starts today, or
what ends today. Descriptions can hold checklists: tick boxes in the description box or straight on the
card, with a progress bar above the item's name.

## Not in this plan

- Home's own lists (Today's Tasks, Today's Events, In progress) keep their current rules for which
  task goes where; only the Tasks and Events pages change in item 1.
- No tabs on In Progress sections; no remembered tab (each visit starts on "All").
- Checklists inside bullets ("- [ ] …") and nested checklists: a checklist line is just a line that
  starts (after its indent) with a box.

## Items

Build them in this order. Each one is its own branch and can be merged on its own.

### 1. Today sections on the Tasks and Events pages, with tabs

- **Owner's idea:** tabs "All", "Start today" and "End today", and tasks that start today moved out of
  Upcoming into a "Today's Tasks" section on the Tasks page (like the Events page's Today's Events).
- **Found while planning:** today the Tasks page has Overdue, Daily, In Progress (started on an
  earlier day, not due yet), Upcoming (everything else, including tasks that start today) and
  Completed; the Events page has Today's Events (start today), In Progress (started earlier, not over),
  Upcoming and Past. Neither has tabs.
- **Decision:** preview option **X**: the tabs go on the Today sections, which hold everything that
  starts or ends today; In Progress keeps what started on an earlier day and ends later. Each item
  shows in one section only.
- **Branch:** `plan/in-progress-and-checklist/1-today-tabs`
- **What it does:** on the Tasks page, a new Today's Tasks section (after the Daily tasks) lists every
  unfinished task that starts or is due today, taken out of In Progress and Upcoming. On the Events
  page, Today's Events also lists events that end today. Both Today sections have three tabs: All,
  Start today, End today. The Tasks page gets a Today count tile.
- **Rules decided:**
  - Tasks page: a new **Today's Tasks** section holds every unfinished task whose start or deadline
    is today (a task starting later today too, and one with only a start or only a deadline);
  - Events page: **Today's Events** holds every event whose start or end is today (today it holds only
    events that start today);
  - both Today sections get three tabs: **All** (everything in the section), **Start today**, **End
    today**; a task or event that starts and ends today is under both tabs;
  - In Progress on both pages keeps only what started on an earlier day and ends after today;
  - Tasks page order: Overdue, Daily tasks, **Today's Tasks**, In Progress, Upcoming, Completed;
  - Tasks page count tiles: a **Today** tile is added first, so five tiles: Today, In progress,
    Upcoming, Overdue, Completed (like the Events page's Today tile); on a phone they stay readable
    (narrower, or two rows);
  - a day with nothing for today: Today's Tasks stays, with a small card "No tasks for today" (like
    Today's Events' "No events scheduled for today");
  - a task whose deadline has passed is in Overdue as now, also earlier today; finished tasks stay in
    Completed; a repeating task goes by its current round's dates;
  - an event that ended earlier today stays in Today's Events until the day ends (as an event that
    started today does now);
  - each tab shows its count, e.g. "Start today 2"; a tab with nothing shows a short line ("Nothing
    starts today" / "Nothing ends today"); the section's heading count is the All count; the tabs look
    like the app's other skewed choice buttons; each visit starts on All;
  - everything that works in the other sections works here: sort (and "User sort" dragging), search,
    tag filter, select mode, "Show more" after 25;
  - Home doesn't change;
- **Preview:** `previews/1-in-progress.html` (published at
  https://claude.ai/artifact/M1KCkMerU2nvJGC2CLeKEs), option **X** on both pages. **Intent only:** the
  build uses the app's real cards and section headings.
- **Done when:**
  - [ ] with the preview's sample tasks and events (10:00 on a day), the Tasks page's Today's Tasks,
    In Progress and Upcoming hold the same tasks as the preview's option X, and the Events page's Today's
    Events, In Progress and Upcoming the same events
  - [ ] the tabs show the preview's counts and items (a same-day item under both Start today and End
    today), and a task due earlier today is in Overdue, not Today's Tasks
  - [ ] the Tasks page shows five tiles, Today first, and fits a 360px phone without sideways scroll
  - [ ] search, tag filter, sort, select mode ("All" picks only what's shown) and "Show more" work in
    Today's Tasks as in the other sections
  - [ ] across midnight in Thai time, tomorrow's tasks move into Today's Tasks without a reload
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** the Tasks and Events pages with real data on a computer and a phone: the
  Today sections, the tabs, the five count tiles.
- **Needs:** nothing
- **Depends on:** nothing

### 2. Checklists in descriptions, with a progress bar above the name

- **Owner's idea:** (37) a checklist in the description editor, with a progress bar that can be seen
  above the task's name (outside the editor).
- **Decision:** preview option **A** for both questions: a thin bar with "2 / 5 done" above the name,
  green when everything is ticked; the boxes can be ticked straight from the card too.
- **Branch:** `plan/in-progress-and-checklist/2-checklist`
- **What it does:** a "☑ Check" button in the description box turns lines into checklist lines with a
  box. The boxes can be ticked in the box, and on every card or list that shows the description. Above
  the item's name, a thin bar shows "N / M done", green when all are ticked. Ticking a task's last box
  offers to mark the task done. LINE messages show the boxes as ☐ / ☑.
- **Rules decided:**
  - tasks, events and interests all get checklists (the description box is the same for all three);
  - a "☑ Check" button in the description box's toolbar adds a checklist line; the boxes can be
    ticked in the box and on the cards;
  - above an item's name, when its description has checklist lines: a thin bar and "N / M done";
    green when all are ticked;
  - wherever a description is shown (the Tasks, Events and Interests cards; Home's Today lists, Main
    Focus and details window) its boxes show and can be ticked, and the bar is above the name; Home's
    In progress cards (which show no description) show only the bar;
  - ticking a box on a card saves at once, like ticking a task done;
  - ticking a task's last box shows a small message "All ticked: mark the task done?" with a button
    that ticks the task done (as its own Done button does); ignoring it changes nothing; events and
    interests have no "done", so they only get the green bar;
  - LINE messages show checklist lines as "☐ item" and "☑ item" (the three LINE functions need a
    deploy after merging); nothing else in the messages changes;
  - Enter at the end of a checklist line starts a new one ("☐ " with the same indent), whether Auto •
    is on or off; Enter on an empty checklist line ends the list (a plain new line), like Auto •;
  - stored in the description text as `[ ] ` (not ticked) or `[x] ` (ticked; `[X]` counts too) at the
    start of a line, after any leading spaces, so the text stays readable anywhere it's copied; it's
    drawn as a box, never as the brackets; a ticked line's text is drawn struck through and muted;
  - the box is part of the line's lead (the wrap-indent rule in `src/lib/lineLead.ts`), so a wrapped
    checklist line continues under its text;
  - the "☑ Check" button sits after "⇥ Tab" in the toolbar: with only a caret it puts a box at the
    start of that line (after its spaces); with lines selected, on each of them; if every selected
    line already has a box, it takes them away (so it toggles); with the caret never placed, it adds a
    new checklist line at the end (like "• Add"); each press is one undo step;
  - clicking a box in the description box ticks or unticks it (one undo step); on a card, a tap saves
    the description at once; a failed save shows the usual "Couldn't save" message and the box goes
    back; offline, the tap is refused with that message;
  - the count: M is every checklist line in the description, N the ticked ones; no checklist lines,
    no bar;
  - the "mark done?" message shows only for an unfinished task, once per tap that ticks its last box;
    its button does what the task's own Done button does (sound, repeating task's round message);
  - ticks are part of the description, so Copy copies them as they are, and Recent Changes records a
    tick from a card as an edit of the item (the database logs every save already);
- **Preview:** `previews/2-checklist.html` (published at
  https://claude.ai/artifact/USympPEHXV8Ktnfnw7nQVW), options **A** and **A**. **Intent only:** the
  build uses the app's real editor, cards and sizes.
- **Done when:**
  - [ ] "☑ Check" with a caret, with 3 lines selected, and again on the same lines (removed) saves
    `[ ] ` lines exactly as the rules say, each press one undo step
  - [ ] Enter after a checklist line starts a new `[ ] ` line with the same indent; Enter on an empty
    one ends the list
  - [ ] clicking a box in the description box and on a Tasks, Events and Interests card ticks it and
    saves `[x] `; a refused save puts the box back with the message
  - [ ] the bar shows "2 / 5 done" for a description with 5 checklist lines, 2 ticked, on the cards,
    Home's lists, Main Focus, the details window and Home's In progress cards; green at 5 / 5; no bar
    without checklist lines
  - [ ] ticking a task's last box shows the "mark done?" message, and its button marks the task done
  - [ ] a long wrapped checklist line continues under its text, on cards and in the box
  - [ ] `formatDetail` turns `[ ] Torch` into `☐ Torch` and `[x] Tent` into `☑ Tent` (script), and
    nothing else in LINE's text changes; `deno check` passes for the three functions (if Deno is there)
  - [ ] typecheck, lint and build pass
- **Owner checks by eye:** a checklist in a task, an event and an interest on a computer and a phone:
  the "☑ Check" button, ticking in the box and on the cards, the bar going green, the "mark done?"
  message; after deploying, a LINE message with a checklist.
- **Needs:** function deploy: `send-line-daily`, `send-line-reminders`, `send-line-overdue`
- **Depends on:** nothing

## Questions answered while planning

- **Q:** Which In Progress sections get the tabs: Home's or the Tasks and Events pages'? **A:** The
  Tasks and Events pages'.
- **Q:** Should tasks that start today move into In Progress? **A:** No: into a new Today's Tasks
  section on the Tasks page.
- **Q:** Where do the tabs go? **A:** On the Today sections (option X).
- **Q:** Where does Today's Tasks sit on the Tasks page? **A:** After the Daily tasks, before In
  Progress.
- **Q:** A Today count tile on the Tasks page? **A:** Yes, first of five.
- **Q:** Today's Tasks with nothing today? **A:** A "No tasks for today" card; the section stays.
- **Q:** How does the checklist's progress look above the name? **A:** A bar with "N / M done" (A).
- **Q:** Tick boxes on the card, or only in the edit form? **A:** On the card too (A).
- **Q:** Which items get checklists? **A:** Tasks, events and interests.
- **Q:** On Home too? **A:** Yes, wherever a description is shown; Home's In progress cards get the bar.
- **Q:** When every box is ticked, mark the task done? **A:** Ask with a message that has a button.
- **Q:** Checklists in LINE? **A:** As ☐ / ☑ boxes.
- **Q:** Enter at the end of a checklist line? **A:** Starts a new checklist line, Auto • on or off.

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

Filled in during planning where known, and completed by the build.

1. After merging item 2: deploy `send-line-daily`, `send-line-reminders` and `send-line-overdue`.
2. Nothing else: no migration (the checklist lives in the existing description text); item 1 goes out
   with the next Vercel deploy after merging.
