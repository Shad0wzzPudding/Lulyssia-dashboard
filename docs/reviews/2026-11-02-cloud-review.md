# Cloud review, 2 Nov 2026

Branch `cloud-review-2026-11-02` (from `main` at `f6913d7`), run from a local session. Findings and proposals:
roadmap.md, "Cloud review (2 Nov 2026)".

## Phase 1

The 4 waiting code commits (`a439793`, `1c2f231`, `b11ad23`, `3413919`): no new finding (details in REVIEW.md's history).

## Area order for Phase 2

From the earlier rounds logs: every area was covered on 1 Nov (morning run or evening run). Changed since: only the
editor (`3413919`, after the evening run). So: 10 Editor first; then the areas covered longest ago with nothing changed:
15 Time zones and dates and 6 Navigation (both last covered on 1 Nov morning or 31 Oct late), then 5 Settings,
12 LINE functions, 8 Recent Changes, 9 Attachments.

## Rounds

- Round 1 (10 Editor): read formatted-textarea.tsx's selection, Space, Tab, copy, cut and paste code, lineIndent.ts and checklist.ts's `lineBox`; checked on the test account with a "ZZ" task (deleted afterwards) Shift+Up and Shift+Down selections across checklist lines with Copy (read back by pasting into the title), triple-click + Space, Bold and Check on a triple-clicked checklist line, and undo; found 1 fixed (`b30b327`: triple-click + Space wiped a checklist line's text), 1 proposed (Shift+Up copies a checklist line without its box)
- Round 2 (15 Time zones and dates): read todayTabs.ts, dateOrder.ts, autoDeadline.ts, useLocalToday.ts and Home's today, in progress and upcoming rules; ran a script with TZ=Asia/Bangkok and TZ=UTC: the automatic deadline across a month end, a year end and 29 Feb, the end-before-start check (equal, earlier, missing), the local date at 23:59:59 and 00:00; found no new bug
- Round 3 (6 Navigation): read Navigation.tsx's menu keyboard handling (Escape, arrows, page change); checked in the browser with the keyboard only: Enter on the menu button, arrows, Escape gives focus back to the menu button, Enter on a choice opens the page; no console errors; found 1 proposed (after picking a page, focus is left on the page body)

Stopped after round 3 (local session kept short); the clean-round count stood at 0.
