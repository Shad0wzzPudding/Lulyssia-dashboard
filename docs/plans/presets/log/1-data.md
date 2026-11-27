# 1. Where presets are kept

**Status:** Built
**Branch:** `plan/presets/1-data` (based on `main`)

## Done when
- [x] the migration runs on a copy of the schema (PGlite or a local Supabase) after the existing
      ones, and its checks refuse a 41-character name, `due_amount` 0 and a unit without an
      amount — every migration was run in order in PGlite (with stand-ins for Supabase's `auth`,
      `storage`, `vault`, `net` and `cron`; only the five that read `cron.job` failed, as they need
      the real pg_cron). `20261127000000_presets.sql` ran; it refused a 41-character name, an empty
      name, a name with spaces around it, `due_amount` 0, a unit without an amount, an amount
      without a unit and an unknown unit; a 40-character name was accepted.
- [x] another user's presets can't be read, changed or deleted (a test with two users) — as user B
      (role `authenticated`): B saw only its own preset; updating or deleting A's rows touched 0
      rows; inserting a row with A's id was refused by row level security.
- [x] deleting a tag removes it from the presets that had it — a preset with two tags kept only the
      one that wasn't deleted. `authenticated` still can't run the trigger function directly.
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the
      changed files, `npm run build`.

## Owner checks by eye
None.

## Assumptions
- **Migration name:** `20261127000000_presets.sql` (after the newest one, `20261016000000`).
- **A name with spaces around it** is refused by the database too (the plan says "trimmed"); the
  app trims names before saving, so a person never sees that.
- **An index on `user_id`**, like the other tables got in `20261015000002_user_indexes.sql`.
- **Counting a use** reads the preset's count and saves it plus one (two devices applying the same
  preset in the same instant could count once). No database function was added for it.
- **The double-Enter guard** for a new preset sits with the caller, as it does for tags (the form
  in item 2 ignores a second Create while the first is saving); the hook itself doesn't block.

## Needs
- Migration `supabase/migrations/20261127000000_presets.sql`, applied by the owner before merging
  items 2 to 4.

## Notes
- Code hadn't changed since the plan was written (only plan documents on `main`).
