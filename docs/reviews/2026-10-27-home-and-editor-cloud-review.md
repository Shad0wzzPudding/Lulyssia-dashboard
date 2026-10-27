# Cloud review, 27 Oct 2026 (home and editor): rounds log

Branch `cloud-review-2026-10-27-home-and-editor`: `main` at `5e4f2a9` with the 9
`plan/home-and-editor/*` branches merged in their order (1 → 8, then summary), since the build isn't
on `main` yet. Merge those branches first, then this one. Checks run on a local copy only: the app in
a local browser with every backend request answered by test data. Nothing reached the live project.

## Order of areas
Asked for: Home and the editor first. Today's earlier run (docs/reviews/2026-10-27-cloud-review.md)
covered all 15 areas; since then the build changed Home (1), the editor (10), Settings (5), the
Tasks and Events forms (2, 3), the data hooks (11: a new settings hook), the LINE text (12) and
added controls to check on phones (14); the HEIC change touched attachments (9). Order:
1 Home → 10 Editor → 5 Settings → 2 Tasks → 3 Events → 11 Data hooks → 9 Attachments →
12 LINE functions → 14 Phone layouts and accessibility. The other areas (4, 6, 7, 8, 13, 15) haven't
changed since that run and count as covered.

## Phase 1
- Reviewed `aef5a5a`, `99fc59a`, `b2b4c9b`, `8255ea5`, `74fc1a2` on `main`: no new finding. The HEIC
  conversion itself couldn't be run here (no HEIC sample, and Chromium can't show HEIC to compare).
- Reviewed the build's commits (items 1–8, the two merges that carry items 1 and 5): 2 fixed, both in
  the build: the Editor setting stayed with the tab after a change of account (`bfcfce1`); Enter
  during a word's composition lost the word, from item 2 (`41e38f7`).

## Phase 2
- Round 1 (1 Home): read HomePage.tsx and InProgressCard.tsx in full (merged build); checked in a browser every place at 320, 360, 390 and 430px with web-address titles (no sideways scroll, no pencil off-screen, details window no wider than the screen), an event with no end, and a fake clock from 23:58 to 00:01 Thai time (a same-day task and event for 1 Nov move into Today with "Start and end today"); found no new bug
- Round 2 (10 Editor): read formatted-textarea.tsx and lineIndent.ts in full; checked the line helpers against a simple reference on 100,000 random texts (0 differences) and in a browser Tab/Shift+Tab in an empty box and with Auto • bullets in the Interests form, saved; found no new bug
- Round 3 (5 Settings): read EditorSettings.tsx, SettingsPage.tsx and useEditorSettings.ts; checked in a browser a refused save of the Editor choice (it looked saved, no message, gone after a reload); found 1 fixed (`2f00e3c`)
- Round 4 (2 Tasks): read TaskFormDialog.tsx; checked in a browser a double click on Home's pencil (one form) and on Update for a repeating task with a slow save (one save, repeat anchor kept); found no new bug
- Round 5 (3 Events): read EventFormDialog.tsx; the same double-click checks for an event; found no new bug
- Round 6 (11 Data hooks): read useEditorSettings.ts (after the two fixes) and useSortPreference.ts beside it; checked an account change and a refused save again (both fixed, see Phase 1 and round 3); found no new bug
- Round 7 (9 Attachments): read heic.ts and AttachmentsField.tsx's picture code; checked in a browser that a converted picture's in-page link opens in a new tab and shows the picture (the conversion itself can't run here); found no new bug
- Round 8 (12 LINE functions): read lineText.ts, lineCard.ts, missedDeadline.ts and the description parts of send-line-daily (nothing after `formatDetail` trims the indents); found no new bug
- Round 9 (14 Phone layouts and accessibility): checked in a browser the pencils' tap size (20×20), the Editor card at 320px (no sideways scroll; tapping a choice's name picks it; arrows move and Space picks), and the accessibility tree of an In progress card; found 2 proposed
- Round 10 (6 Navigation): read useWindowOpen.ts and Navigation.tsx's Escape handling beside the editor's new Esc rule; checked in a browser that Home's edit form hides the round menu button, the first Esc in the description keeps the form, the second closes it and the button comes back; found no new bug
- Round 11 (4 Interests): read InterestsPage.tsx's form (it uses the same editor; nothing else changed); checked in a browser (round 2's script runs in the Interests form) Tab, Shift+Tab, bullets and saving; found no new bug
- Round 12 (15 Time zones and dates): read the date parts of item 1 (device-time `isToday`/`isSameDay`, as the rest of Home); checked midnight in Thai time (round 1's fake clock); found no new bug

Stopped: rounds 10, 11 and 12 found no new bug in a row, each on an area not covered before in this
run; the areas not covered here (7, 8, 13) were covered in today's earlier run and haven't changed.
