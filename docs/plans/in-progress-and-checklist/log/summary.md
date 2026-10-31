# Build summary: in-progress-and-checklist

Built on 31 Oct 2026 against `main` at `3359d35`, the commit the plan was written against (`main` hadn't
changed since). Both items are **Built**. Each item's log, with how every "Done when" line was checked,
is in this folder.

## Items

| # | Item | Status | Branch | Based on |
| --- | --- | --- | --- | --- |
| 1 | Today sections on the Tasks and Events pages, with tabs | Built | `plan/in-progress-and-checklist/1-today-tabs` | main |
| 2 | Checklists in descriptions, with a progress bar above the name | Built | `plan/in-progress-and-checklist/2-checklist` | main |

## Merge order

`plan-draft/in-progress-and-checklist` (the plan itself; not on `main` yet) → 1 → 2 → this summary
branch last (it's based on the plan branch). Items 1 and 2 don't depend on each other.

Tried: merging the plan branch, item 1 and item 2 in this order into a local copy of `main` gave no
conflicts (item 2's imports were moved so the two don't touch the same lines), and the result passes
typecheck, lint (`eslint src`) and build; both items' browser checks were run again on it and passed.

## Deploy checklist

1. After merging item 2 (`plan/in-progress-and-checklist/2-checklist`): deploy `send-line-daily`,
   `send-line-reminders` and `send-line-overdue`.
2. Nothing else: no migration. Item 1 goes out with the next Vercel deploy after merging.

## Assumptions and open questions (one at a time)

1. **Item 1:** on phones the five count tiles show as two rows (3 + 2); in one row their labels were
   cut short ("In pro…") at 360px. One row from tablet width up.
2. **Item 1:** a tab that hides some of today's items hides them like a search: select mode's "All"
   doesn't pick them, and they're unpicked.
3. **Item 1:** the tabs are the app's normal small buttons (filled for the chosen one), each with its
   count.
4. **Item 1:** an event that ended earlier today isn't "past" until the day ends, so "Clear Past" leaves
   it alone until then (it's in Today's Events).
5. **Item 1:** a task that started on an earlier day without a deadline stays in Upcoming, as now.
6. **Item 2:** the toolbar has a "move back out" Tab button (added on `main` before this plan), so
   "Check" comes after both Tab buttons; icon lucide `ListChecks`, word "Check".
7. **Item 2:** in the description box, a box stands for its "[ ] " including the space after it, so the
   caret after a box is always at its text (typing between a box and its space turned the line back
   into plain text). Home goes to the line's very start, before the box.
8. **Item 2:** a tick from a card is saved without a "Task updated" message; a refused one shows the
   cards' usual "Failed to update task. Please try again." (the plan said "Couldn't save", the forms'
   wording); the box doesn't move until the save is back.
9. **Item 2:** Home's Upcoming lists show no descriptions, so they have no bar.
10. **Item 2:** copying a description's text from a card copies the boxes as nothing (they're drawn);
    the stored text keeps `[ ] ` / `[x] `.
11. **Item 2:** a ticked line is muted and crossed out in the description box too (drawing only).

Nothing is blocked.

## Not verified

- **Item 2:** `deno check` on the three LINE functions: Deno isn't available in this session. Instead,
  `tsc --strict` on a copy of the changed file passes, and a script checked `formatDetail` with
  checklist lines.

## Owner checks by eye

- **1:** the Tasks and Events pages with real data on a computer and a phone: the Today sections, the
  tabs, the five count tiles.
- **2:** a checklist in a task, an event and an interest on a computer and a phone: the "☑ Check" button,
  ticking in the box and on the cards, the bar going green, the "mark done?" message; after deploying,
  a LINE message with a checklist.

## Stopped early?

No: both items are built.
