# Build summary: home-calendar

Built on 3 Nov 2026 against `main` at `57d208d` (the plan was written at `4b2f960`; only the plan's own
files changed since).

## Items
| # | Item | Status | Branch |
| --- | --- | --- | --- |
| 1 | An event's start line is green | Built | `plan/home-calendar/1-green-start` (from `main`) |
| 2 | Marked dates show only the round circle; no more hiding a date | Built | `plan/home-calendar/2-circle-only` (from `main`) |
| 3 | A plus button makes a new task or event on the picked date | Built | `plan/home-calendar/3-plus-button` (on item 2's branch) |

## Merge order
1. `plan/home-calendar/1-green-start`
2. `plan/home-calendar/2-circle-only`
3. `plan/home-calendar/3-plus-button` (contains item 2; merging it alone brings item 2 too)
4. `plan/home-calendar/summary`

Items 1 and 3 both change `HomePage.tsx` in different places; merged together in a test they go in
without conflicts and pass the typecheck.

## Deploy checklist
Nothing to deploy or migrate: all three items are front-end only and go out with Vercel when merged.

## Assumptions to go through
1. (Item 2) The old list of hidden dates is removed from the browser each time Home opens (removing a
   key that's already gone does nothing), rather than remembering it was removed.
2. (Item 2) A marked date keeps its text colour with the bold number; only the square background went.
3. (Item 3) Picking "New task" or "New event" plays the add sound, like the Add Task / Add Event buttons.
4. (Item 3) The form opens once the menu has closed; closing the menu without a choice puts the focus
   back on the plus.
5. (Item 3) The menu opens below the plus, lined up with its right edge.

Nothing is blocked.

## Not verified
- (Item 3) Saving a "ZZ …" task and event on the Test-dummy account: this build doesn't write to the
  live project. The same flow was checked with the local test backend (both saved on the picked date
  at 09:00 and listed in that date's panel). Worth doing on Test-dummy after merging, then deleting them.

## Owner checks by eye
- (Item 1) The green line next to an event's green start time.
- (Item 2) The circles on a few marked dates, next to today's ring and the picked date.
- (Item 3) The plus and its menu (look, place, on a phone too); the add sound when picking an entry.
