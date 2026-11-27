# 2. Presets in Settings, and the preset form

**Status:** Built
**Branch:** `plan/presets/2-settings` (on item 1's branch: merge `plan/presets/1-data` first)

## Done when
- [x] a preset can be made, changed and deleted from Settings, and the list shows it (most used
      first, new ones at the end) — checked in a browser (Playwright) on a test page with the
      Presets card and an in-memory stand-in for the database: made three presets (they listed in
      the order made), gave the second more uses (it moved to the top), edited the first (its form
      opened filled in, "Edit Preset" / "Update"), deleted one after Lulyssia's question ("Delete
      the preset "Trip"? Tasks and events already made with it stay as they are." / "Cancel",
      "Yes, delete it"). A failed save kept the form open with the typed name; "Saving…" showed
      while waiting.
- [x] an empty name can't be saved; 41 characters can't be typed — Create with no name showed
      "Give the preset a name." and saved nothing; typing 50 characters kept 40.
- [x] the switch off saves no due date; on, it saves the number and unit — saved rows: "Lab report"
      3 days, "Trip" (switch off) no amount and no unit, and an emptied number box saved as 1 day.
- [x] the cards after Presets swap black/white as above — `SettingsPage.tsx`: Tag Management
      (black), Presets (white), Display (black), Sound (white), Editor (black).
- [x] at 360px nothing widens the page, and a one-long-word name or tag wraps inside its row —
      page width stayed 360px with the card and with the form open; the long name and long tag
      wrapped inside the row.
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the
      changed files, `npm run build`.

## Owner checks by eye
- The Presets card (desktop and phone), the form, the swapped colours of Display, Sound and Editor.

## Assumptions
- **Cards icon:** lucide's `GalleryHorizontalEnd` (a stack of cards).
- **Row layout:** the tags, the due label and "used 9×" sit on one wrapping line under the name; the
  pencil and trash on the right.
- **Due unit list order:** Days, Hours, Weeks (the plan says "Days first"; the other two keep their
  order).
- **The delete question** plays the delete sound when confirmed (Lulyssia's question also plays its
  own confirm sound, as everywhere else).
- **Description placeholder:** "What a task or event made with it starts with".
- **Name label:** a "Name" label over the name box (the task form has none, but the plan's error
  line sits under it).

## Needs
- Item 1's migration `20261127000000_presets.sql` applied.

## Notes
- `src/components/dashboard/PresetFormDialog.tsx` (the shared form), `PresetManager.tsx` (the
  card, plus `PresetDeleteDialog`, the delete question item 3 reuses) and `src/lib/presets.ts`
  (the "+3 days" / "Due: start +3 days" wording).
