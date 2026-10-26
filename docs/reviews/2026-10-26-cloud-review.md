# Cloud review, 26 Oct 2026: rounds log

Branch `cloud-review-2026-10-26` (from `cloud-review-2026-10-25`). Checks run on a local copy only: the
app in a local browser with every backend request answered by test data, migrations on a local Postgres,
LINE functions under Deno with LINE and the database faked. Nothing reached the live project.

## Phase 1
- Reviewed `aee35f4`, `a85c51c`, `33e1578` (25 Oct): no new finding.

## Phase 2
- Round 1 (Home): read HomePage.tsx's today, in-progress, upcoming, Recent Changes and Main Focus logic and the tasks/events query order in useDashboardData.ts (Home's "Upcoming" first 3 are the soonest because the lists load sorted by date); checked in a browser at 360 and 390px (no sideways scroll, no page errors); found no new bug
- Round 2 (Tasks, daily and repeating): read TasksPage.tsx's tick, "Done for good", Clear/Undo and Show more code and DailyTasksSection.tsx's midnight move; checked in a browser with a fake clock that an edit open over midnight moves to today's copy and Update saves there, and ticking a repeating task whose deadline had passed while the app was open; found 1 fixed (the message named a time already gone)
- Round 3 (Events): read EventsPage.tsx's sections, Show more, End wording and delete note; checked in a browser 31 upcoming and 31 past events in the default sort and in "User sort" (25 at a time, Past folded or with its own Show more); found no new bug
- Round 4 (Interests): read InterestsPage.tsx's pin, unpin, copy, batch copy, batch pin/unpin and bulk delete; found no new bug
- Round 5 (Settings): read DisplaySettings.tsx and usePageTransitions.ts; checked in a browser on a device asking for reduced motion: the "!" on the drawer tab and the Settings slab, both switches off at first, turning them on saves to their own keys and leaves the usual ones alone, "Tap to dismiss" clears the "!"; found no new bug
- Round 6 (Navigation and page changes): read Index.tsx's page switching (every path goes through showPage, which lets go of the "Add Task" request) and the transition guard; checked in a browser with the train on that a second pick during the train is ignored and the page lands where first picked; found no new bug

Stopped: rounds 4, 5 and 6 found no new bug in a row (round 3 too), each on an area not covered before in this run.
