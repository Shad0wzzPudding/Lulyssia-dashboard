# Plan: calendar-search

**Status:** Ready to build <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `76a1ea8` (2026-11-27)
**Decided with the owner on:** 2026-11-27

## Goal

Home's Calendar Overview gets a search. Typing lists the matching tasks and events from any date in
the date panel, upcoming first, and only dates with a match stay highlighted on the calendar.
Picking a result moves the calendar to that month and opens the date; "← Results" goes back to the
list.

## Not in this plan

- The Tasks, Events and Interests pages' search bars, and the "Show all" window's search.
- Finished tasks: the calendar doesn't show them, so the search doesn't find them.
- The rest of Home, and the date panel's items, `+` and `−` (they work as now when a date shows).
- Other animations for the results (Slide, the "Show all" panel's Slam, Deal): only Rise (item 2).

## Items

Build them in this order. Each one is its own branch and can be merged on its own unless it says
"Depends on".

### 1. Search, results and jump

- **Branch:** `plan/calendar-search/1-search`
- **What it does:** a small search box ("Search tasks and events…") in the Calendar Overview. While
  it has a search, only dates with a matching item stay highlighted, and the date panel on the
  right shows "Results for …" with the matching items instead of a date. Picking a result moves the
  calendar to that month, selects the date and shows it in the panel, with a "← Results" button in
  the panel's header that goes back to the list. Clearing the search (its ✕, Esc, or deleting the
  text) brings every highlight back and the panel shows the selected date (or "Select a Date" when
  none is selected, as today).
- **Rules decided:**
  - **Where:** wherever the date panel sits under the calendar, the search goes between the
    calendar and the panel, right above the results, so they show while typing (owner's choice).
    The card's grid puts the panel beside the calendar only from `lg` (1024px), so: under `lg`,
    between the calendar and the panel; from `lg`, above the calendar. Use the "Show all" window's
    small search as the model (`CollapsiblePreview.tsx`: the `Input` with the search icon, its ✕
    "Clear search" button, and 16px text on phones / 14px from `md` so iPhones don't zoom in); its
    own label is "Search tasks and events on the calendar".
  - **How it reads a search:** exactly like the pages: `searchItems` / `parseSearch` /
    `searchHasFilter` from `src/lib/sortAndFilter.ts` (title and description, commas mean "or",
    "!" hides, quotes keep a comma or "!" as text). A search counts only when `parseSearch` gives at
    least one term (a lone "!" or "," doesn't start one).
  - **Results header:** "Results for" then, for a search with options (`searchHasFilter`), the same
    green and red chips as the pages (`SearchChips`), shown in the panel's header after "Results
    for" (owner's choice), not under the box; for a plain search, the words in quotes:
    Results for "dentist". Under it a small line: "N found · pick one to open its date". No
    results: "Nothing matches".
  - **What it finds:** what the calendar shows: unfinished tasks (by `start_date` and `deadline`)
    and all events, past ones included (by `start_time` and `deadline`), the same items as
    `markedDates` and `getDateDetails` in `HomePage.tsx`. A task with no dates (or a date that
    doesn't read as a date) isn't on the calendar, so it isn't found. Matching and editing update
    live: an item changed or deleted while the results show changes or leaves the list.
  - **One row per item** (owner's choice): its title, its type badge, and its dates on the right:
    "Start <date>" in green and "Due <date>" (tasks) / "End <date>" (events) in red, one under the
    other. Dates read like the app's In progress cards: "Tue 3 Nov, 10:46" (`format(…, 'EEE d MMM,
    HH:mm')`), with the year after the month when it isn't this year ("Tue 3 Nov 2027, 10:46"). A thin line at its left edge like the date
    panel's cards: green with a start only, red with a due/end only, the green-over-red split with
    both. When the start and the due/end fall on the same day, one green-over-red line and one date
    line in the wording of the app's `sameDayLabel` with both times: "Start and end Tue 3 Nov,
    09:00–11:00" ("Start and end today, 09:00–11:00" for today). Picking it opens its
    start date, or its due/end date if it has no start. Each row is a button, reachable by Tab and
    opened with Enter or Space. Titles wrap inside the row (`[overflow-wrap:anywhere]`, as the date
    panel's cards do); the dates never wrap.
  - **Order** (owner's choice): items that haven't ended yet (their last date is today or later)
    first, by the date they open, soonest first; then a small "Past" heading and the rest, the most
    recently ended first. Past rows are a little faded. Days are worked out the same way the
    calendar already does it (`startOfDay`). Items on the same day go by time, then by title.
  - **Long lists** scroll inside the panel, like the date's list today (`max-h-72 overflow-y-auto`).
  - **Highlights:** while searching, a date is highlighted only if a matching item starts or is
    due/ends on it (both dates of an item stay highlighted). The note under the calendar reads
    "Highlighted: dates with a match" while searching, and its usual words otherwise.
  - **After picking** (owner's choice): the search text and the filtered highlights stay. The panel
    shows the date as it does today (items, `+`, `−`, delete mode), plus "← Results" in its header,
    which returns to the list. The `+ / −` stay where they are (the right end of the date's
    header); "← Results" sits just left of them, only while searching. The results list itself
    has no `+ / −`. Clicking another date on the calendar while searching also shows that
    date, with "← Results". Typing more in the search goes back to the results. Clicking the
    selected date again unselects it as today ("Select a Date"), still with "← Results".
  - **Focus and screen readers:** after picking a result, the focus goes to "← Results" (Enter
    then goes straight back); after "← Results", it goes to the row that was picked (the first row
    if it's gone). The "N found" line (and "Nothing matches") is read out politely (`aria-live`).
  - **Jumping months:** the calendar must follow the picked result to its month. Today the
    `Calendar` has no `month` prop, so it needs a controlled `month` / `onMonthChange`; the arrows
    still work as now. Typing doesn't move the calendar, and ending the search leaves it on the
    month it shows.
  - Delete mode turns off when the results show (there is nothing to delete in the list).
  - The search starts empty each time Home opens; it isn't remembered.
- **Preview:** `previews/search-placement.html`, published at
  https://claude.ai/artifact/8txW7LHDbJDL1U7EMcLXvA. Intent only: use the app's real calendar,
  search box, chips, badges and card styles. (It shows the search above the calendar at every
  width; under 1024px the build puts it under the calendar, as decided.)
- **Done when:**
  - [ ] typing a word shows "Results for "word"" in the date panel with every matching unfinished
        task and event, one row each, and only their dates highlighted;
  - [ ] a search with a comma or "!" shows the chips after "Results for", and finds what the pages'
        search would find for the same text;
  - [ ] an item with a start and an end is one row showing both dates; picking it opens its start
        date; one with only a due/end date opens that date;
  - [ ] upcoming items come first, soonest first; then "Past", most recent first; a finished task
        never appears;
  - [ ] picking a result in another month moves the calendar to that month and selects the date;
        "← Results" goes back to the same list; clicking another date while searching also shows
        "← Results";
  - [ ] ✕, Esc and an emptied box end the search: all highlights back, the selected date (or
        "Select a Date") in the panel, no "← Results";
  - [ ] an item that starts and ends on the same day shows "Start and end <date>" once; a task with
        no dates is never found;
  - [ ] at 390px and 800px the search sits between the calendar and the panel; at 1024px it sits
        above the calendar; nothing widens the page at 360px, and a one-long-word title wraps
        inside its row;
  - [ ] keyboard only: Tab reaches the search, each result and "← Results", and Enter/Space work;
        picking a result puts the focus on "← Results", and "← Results" puts it back on that row;
  - [ ] typecheck, lint and build pass.
- **Owner checks by eye:** the search's place (desktop and phone), the results panel and its chips,
  the result rows and their dates, "← Results".
- **Needs:** nothing (front end only).
- **Depends on:** nothing.

### 2. The results rise in

- **Branch:** `plan/calendar-search/2-rise`
- **What it does:** the panel's rows rise in one by one from below, quickly, as in the preview's
  "Rise" (owner's choice).
- **Rules decided:**
  - Each row (results, and the "Past" heading) fades in from 12px lower, 0.32s, 45ms after the one
    before it.
  - It plays when the results first show, when "← Results" brings them back, and when a picked
    result or a clicked date opens in the panel while searching. Not on every key typed.
  - None for people who ask for reduced motion: put it in the `prefers-reduced-motion:
    no-preference` block in `src/index.css`, like the "Show all" panel's animations.
- **Preview:** `previews/search-placement.html` ("Results appear: Rise"). Exact for the timing,
  intent only for the look.
- **Done when:**
  - [ ] the rows rise in at the moments above and not while typing more letters;
  - [ ] with reduced motion turned on, nothing moves;
  - [ ] typecheck, lint and build pass.
- **Owner checks by eye:** the Rise motion.
- **Needs:** nothing.
- **Depends on:** 1.

## Questions answered while planning

- **Q:** What should the search do? **A:** Find and jump (list matching items from any date; picking
  one moves the calendar there and opens the date), and filter the highlights so only dates with a
  match stay highlighted.
- **Q:** Where does it sit? **A:** A: above the calendar, with the results filling the date panel
  (B, a drop-down beside the title, was the other choice).
- **Q:** How does it read a search? **A:** Same as the pages, with the chips shown in the panel's
  header after "Results for".
- **Q:** Which items does it find? **A:** What the calendar shows: unfinished tasks and all events.
- **Q:** An item with two dates? **A:** One row per item, showing both dates; it opens its start
  date (or its due/end date with no start).
- **Q:** Order? **A:** Upcoming first, then "Past", most recent first.
- **Q:** After picking a result? **A:** Keep the search, with a "← Results" button to go back.
- **Q:** Do the `+ / −` stay in place? **A:** Yes, at the right of the date's header; "← Results"
  goes just left of them. They're hidden only while the results list shows.
- **Q:** Animation? **A:** Rise (Slide and none were the others).
- **Q:** On a phone? **A:** The search goes under the calendar, right above the results; that is,
  wherever the panel sits under the calendar (under 1024px), found while checking the plan.
- **Filled in by Claude while checking the plan (owner to object if wrong):** same-day items show
  "Start and end <date>"; row dates in the In progress cards' format with times ("Tue 3 Nov, 10:46");
  dateless tasks aren't found; ties go by time, then title; long lists
  scroll in the panel; focus goes to "← Results" after picking and back to the row after it;
  clicking the selected date again unselects it as today; the calendar doesn't move while typing.

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

- [x] Nothing to apply or deploy: front end only, out with Vercel when merged. Merge order: 1, then 2.

## Summary

`summary.html`: the whole build at a glance (now → after), published at https://claude.ai/artifact/HuQfa2mo4s6a6YGyHRZJuZ
