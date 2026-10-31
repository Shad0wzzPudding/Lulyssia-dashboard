# Plan: Today sections with tabs, and checklists in descriptions

**Status:** Draft <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `3359d35` (31 Oct 2026)
**Decided with the owner on:** 31 Oct 2026

## Goal

The Tasks page gets a Today's Tasks section like the Events page's Today's Events, and both Today
sections show everything that starts or ends today, with tabs to see all of it, what starts today, or
what ends today. (More goals are added as the planning goes on.)

Each item starts as "Not decided yet"; its decisions are written in as soon as the owner makes them,
so the plan can be picked up again at the first undecided item.

## Not in this plan

<filled in as the planning goes on>

## Items

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
- **What it does:** (being decided)
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
  - (more being decided)
- **Preview:** `previews/1-in-progress.html` (published at
  https://claude.ai/artifact/M1KCkMerU2nvJGC2CLeKEs), option **X** on both pages. **Intent only:** the
  build uses the app's real cards and section headings.
- **Done when:** (being decided)
- **Owner checks by eye:** (being decided)
- **Needs:** nothing
- **Depends on:** nothing

### 2. Checklists in descriptions, with a progress bar above the name

- **Owner's idea:** (37) a checklist in the description editor, with a progress bar that can be seen
  above the task's name (outside the editor).
- **Decision:** preview option **A** for both questions: a thin bar with "2 / 5 done" above the name,
  green when everything is ticked; the boxes can be ticked straight from the card too.
- **Branch:** `plan/in-progress-and-checklist/2-checklist`
- **What it does:** (being decided)
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
  - (more being decided)
- **Preview:** `previews/2-checklist.html` (published at
  https://claude.ai/artifact/USympPEHXV8Ktnfnw7nQVW), options **A** and **A**. **Intent only:** the
  build uses the app's real editor, cards and sizes.
- **Done when:** (being decided)
- **Owner checks by eye:** (being decided)
- **Needs:** (being decided)
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

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

Filled in during planning where known, and completed by the build.
