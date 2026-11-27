# 1. Search, results and jump

**Status:** Built
**Branch:** `plan/calendar-search/1-search` (based on `main`)

## Done when
- [x] typing a word shows "Results for "word"" in the date panel with every matching unfinished
      task and event, one row each, and only their dates highlighted — checked in a browser
      (Playwright, Thai time, today set to Fri 27 Nov 2026) on a test page with made-up tasks and
      events: "report" listed the 6 matches, and only their days stayed highlighted.
- [x] a search with a comma or "!" shows the chips after "Results for", and finds what the pages'
      search would find for the same text — "dentist, !old" showed the green "dentist" and red
      "old" chips in the header and 2 rows; the matching is the pages' own `searchItems`.
- [x] an item with a start and an end is one row showing both dates; picking it opens its start
      date; one with only a due/end date opens that date — "Write report" showed "Start Fri 20 Nov,
      10:00" over "Due Thu 10 Dec, 17:00"; picking the Jan 2027 trip opened Fri 15 Jan (its start).
      Due-only rows open their due date (`opens = start ?? end` in `src/lib/calendarSearch.ts`).
- [x] upcoming items come first, soonest first; then "Past", most recent first; a finished task
      never appears — seen in the "report" and "dentist" lists; the finished "Report draft done"
      never showed.
- [x] picking a result in another month moves the calendar to that month and selects the date;
      "← Results" goes back to the same list; clicking another date while searching also shows
      "← Results" — the calendar went from November 2026 to January 2027; "← Results" showed the
      same list; clicking Dec 10 showed it with "← Results"; clicking it again showed
      "Select a Date" with "← Results".
- [x] ✕, Esc and an emptied box end the search: all highlights back, the selected date (or
      "Select a Date") in the panel, no "← Results" — checked all three.
- [x] an item that starts and ends on the same day shows "Start and end <date>" once; a task with
      no dates is never found — "Start and end Thu 3 Dec, 09:00–11:00" and "Start and end today,
      08:00–18:00"; a dateless task and one with an unreadable date were never found.
- [x] at 390px and 800px the search sits between the calendar and the panel; at 1024px it sits
      above the calendar; nothing widens the page at 360px, and a one-long-word title wraps
      inside its row — measured at 360, 390, 800, 1024 and 1280px: page width never grew, the long
      title stayed inside its row.
- [x] keyboard only: Tab reaches the search, each result and "← Results", and Enter/Space work;
      picking a result puts the focus on "← Results", and "← Results" puts it back on that row —
      checked at 390 and 1280px.
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on
      the changed files, `npm run build`.

## Owner checks by eye
- The search's place (desktop: above the calendar; phone and tablet: under the calendar, right
  above the panel).
- The results panel and its chips, the result rows and their dates, "← Results".
- On narrow phones a row's dates drop under its title (see Assumptions).

## Assumptions
- **Narrow rows:** when a row has no room for the title and the dates side by side (phones), the
  dates move under the title, still on the right, so nothing widens the page. From about 400px
  wide they sit beside the title as planned.
- **"Start and end" colour:** the one same-day date line is in the app's blue (like the same-day
  badge), since it is both green and red.
- **"← Results" when no date is selected:** it sits at the top left of the "Select a Date" panel
  (there is no date header to put it in).
- **Highlights note:** "Highlighted: dates with a match" replaces the line under the calendar
  ("Click on highlighted dates to see details"); the 💡 hint inside "Select a Date" stays as it is.
- **Tab order from 1024px:** the search shows above the calendar but comes after it when tabbing,
  so Tab goes calendar → search → results.
- **Picking a result in the same view:** the calendar's month follows any picked result, even one
  in the month already shown (no visible change then).

## Needs
Nothing (front end only).

## Notes
- The `Calendar` component already passes every prop on to the date picker, so the controlled
  month is just `month` / `onMonthChange` on Home's calendar; `calendar.tsx` is unchanged.
- The search logic lives in `src/lib/calendarSearch.ts`; the box and results panel in
  `src/components/dashboard/CalendarSearchResults.tsx`.
- No code had changed since the plan was written (only plan documents on `main`).
