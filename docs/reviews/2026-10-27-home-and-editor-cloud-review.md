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
