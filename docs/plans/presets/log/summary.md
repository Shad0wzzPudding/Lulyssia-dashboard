# presets: build summary

Built 2026-11-27 against `main` at `221dabc` (no code had changed since the plan's `5922c3f`; only
plan documents).

## Items

| # | Item | Status | Branch |
|---|------|--------|--------|
| 1 | Where presets are kept | Built | `plan/presets/1-data` (from `main`) |
| 2 | Presets in Settings, and the preset form | Built | `plan/presets/2-settings` (on item 1) |
| 3 | The preset cards in the task and event forms | Built | `plan/presets/3-cards` (on item 2) |
| 4 | The apply moment | Built | `plan/presets/4-moment` (on item 3) |

The database parts were checked in PGlite (all migrations in order, then the checks, a two-user
test and tag deletion). The screens were checked in a browser on test pages with the real
components, made-up presets and an in-memory stand-in for the database (the live database was
never touched). Details in `1-data.md` to `4-moment.md`.

## Merge order
1. `plan/presets/1-data`
2. `plan/presets/2-settings`
3. `plan/presets/3-cards`
4. `plan/presets/4-moment`
5. `plan/presets/summary` (this summary)

(Each branch already contains the ones before it, so merging `4-moment` alone brings all four.)

## Deploy checklist
1. Apply migration `supabase/migrations/20261127000000_presets.sql` (from `plan/presets/1-data`)
   **before** merging items 2 to 4: without the table the Settings card and the "Presets" layer show
   errors.
2. After merging `plan/presets/3-cards`: run `npm install` locally (new package `motion`); Vercel
   installs it on deploy.
3. Nothing else: front end otherwise, out with Vercel when merged. No edge functions.

## Assumptions to go through
Item 1:
1. Migration file name `20261127000000_presets.sql`.
2. The database also refuses a name with spaces around it (the app trims first).
3. An index on `user_id`, like the other tables.
4. Counting a use reads the count and saves it plus one (two devices applying the same preset in
   the same instant could count once).
5. The double-Enter guard for a new preset sits in the form (as with tags), not in the hook.

Item 2:
6. Cards icon: `GalleryHorizontalEnd` (a stack of cards), used in Settings, the forms' "Presets"
   button and the layer's banner.
7. Settings row: tags, due label and "used 9×" on one wrapping line under the name.
8. Unit list order: Days, Hours, Weeks.
9. Confirming a delete plays the delete sound (Lulyssia's question also plays its own confirm sound).
10. Description placeholder "What a task or event made with it starts with"; a "Name" label over the
    name box.

Item 3:
11. Spring: stiffness 260, damping 30.
12. Lulyssia's question: "The description already has text." as its title, "Add "<name>" below it,
    or replace it?" under it.
13. The question is skipped when the picked preset has no description format.
14. Lulyssia's question took no focus before (anywhere in the app); only the new three-answer version
    focuses "Add below"; other uses unchanged.
15. ⓘ shows on the cards behind too (dimmed), not reachable by Tab; it opens that card's details.
16. The details window says "No description format" / "No tags" when empty.
17. A later preset without a due offset keeps the start + X rule from an earlier one.
18. The layer's background: the app's background at 94% with a small blur.

Item 4:
19. Esc during the moment works like its Skip.
20. The form stays blocked during the moment too.
21. No extra sound for the moment (success already plays on Apply).
22. The card in the moment is up to 230px wide (60% of the screen on phones).

No item was blocked.

## Owner checks by eye
- Settings: the Presets card (desktop and phone), the preset form, and Display / Sound / Editor now
  black / white / black.
- The forms: the "Description" row with "Presets".
- The layer: the stack and how it feels to drag (desktop and phone), the card (black, white and light
  blue, the tag-colour band under the name, the dots, the butterfly), the labels, the slide-in and
  fade-out, and the sounds (expand, edit, success, cancel).
- The apply moment: Lulyssia, the card turning to light, the fade over the filled form.
- Not tried on a real phone (only phone emulation): worth a try there, including that the form behind
  can't be touched while the cards are up.

Next step: apply the migration, merge the branches in the order above, then run `/cloud-review`.
