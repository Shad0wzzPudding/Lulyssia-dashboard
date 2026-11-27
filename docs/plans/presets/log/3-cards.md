# 3. The preset cards in the task and event forms

**Status:** Built
**Branch:** `plan/presets/3-cards` (on item 2's branch: merge `plan/presets/1-data`, then `2-settings` first)

## Done when
All checked in a browser (Playwright) on a test page with the real task and event forms, made-up
presets and tags, and an in-memory stand-in for the database.
- [x] "Presets" shows in the task and the event form, new and edit, and opens the layer with every
      preset, the most used in front — both forms opened the layer at "1 of 5: Lab report" (the most
      used). The button sits in the new "Description" row, which both forms use whether new or edit.
- [x] dragging, flicking, ‹ ›, ← → and tapping a card behind all move the stack, and it loops —
      → moved one card, ←← from the first wrapped round to the last, › moved one, a slow 260px drag
      moved one, a flick moved further (3 cards at most, by code), a touch swipe on a phone moved
      it, and a tap on a card behind brings it to the front (`onCardClick`).
- [x] Apply follows every rule above — an empty title got the name, a typed title stayed; an empty
      description got the format; with text there Lulyssia asked "The description already has
      text. / Add "Homework set" below it, or replace it?" with "Add below" (focused), "Replace",
      "Cancel": Cancel left the form and the layer (and the pick) as they were, Add below saved
      "Existing\n\n**Aim:** …", Replace swapped it; tags were added, none removed; with no start
      the start became now to the minute and the Deadline start + 3 days; changing the start by
      hand then moved the Deadline to the new start + 3 days, until the Deadline was changed by
      hand; a preset with no due offset left the dates alone. `use_count` went up by 1 per Apply.
- [x] the label shows every tag up to 16 letters, and the first two plus "…" beyond (with three or
      more tags), and never gets wider than its card at 360px — "lab / school" in full, "lab /
      school / homework" (17 letters) as "lab / school / …"; every label fitted inside its 176px
      card at 360px and the page stayed 360px wide.
- [x] details open with a half-second hold and with ⓘ; Edit and Delete work from there; "+" makes a
      preset that then shows in front — a 650ms hold opened the details (letting go picked
      nothing); a hold that moved 20px didn't; ⓘ opened them; "Pick this one" picked; Edit renamed
      the card in place (still picked); deleting the picked preset unpicked it; "+" made "Brand
      new", which came to the front with the focus on it.
- [x] with no presets, the empty message and "+ New preset" show — after deleting them all, and
      with an empty list from the start.
- [x] keyboard only: the whole flow works with Tab, Enter, Space, ← → and Esc — Tab went "+", front
      card, its ⓘ, ‹, ›, Skip (and Apply once something is picked) and stayed inside the layer;
      Enter/Space picked and unpicked; Esc closed the details only, then the layer; the focus went
      back to "Presets".
- [x] while the layer is open, clicking, tapping, typing, scrolling and Tab can't reach the form or
      the page behind it (check on a phone too), and the form works again once it closes — with
      phone emulation: the form's window was inert, a tap where the title box is landed on the
      layer, typing changed nothing, the wheel scrolled neither the page nor the form, Tab never
      left the layer; after Skip the form was usable again. (Emulated phone, not a real device.)
- [x] with reduced motion on, nothing slides or fades — no animation ran on opening, → jumped at
      once, Skip removed the layer at once. Without it: fade in, banner slide, cards slide down,
      0.38s fade out.
- [x] `motion` is added to package.json; typecheck, lint and build pass.

## Owner checks by eye
- The "Description" row with "Presets".
- The layer, the stack and its feel when dragging (desktop and phone).
- The card (black, white and light blue, the tag-colour band under the name, the dots, the
  butterfly); the labels.
- The slide-in and fade-out; the sounds (expand on open, edit on pick, success on Apply, cancel on
  Skip / Esc).

## Assumptions
- **Spring:** stiffness 260, damping 30 (the plan names a spring, not its numbers).
- **Lulyssia's question wording:** "The description already has text." as the title and "Add
  "<name>" below it, or replace it?" under it (her dialog has a title and a line).
- **The question is skipped** when the picked preset has no description format (nothing to add).
- **Lulyssia's question took no focus before** (for every use): only the new three-answer version
  focuses its first answer; the other uses are unchanged.
- **ⓘ on the cards behind** shows too (dimmed with the card) but can't be reached with Tab; pressing
  it opens that card's details.
- **The details window** shows "No description format" / "No tags" when the preset has none.
- **The banner's "+" icon block** uses the same cards icon as Settings (`GalleryHorizontalEnd`).
- **A later preset without a due offset** keeps the start + X rule from an earlier one in the same
  form (its dates are left as they are).
- **The layer's background** is the app's background colour at 94% with a small blur.

## Needs
- Item 1's migration applied; `npm install` (new package `motion`).

## Notes
- New parts: `PresetPicker.tsx` (the layer), `PresetCarousel.tsx` (the stack, positions from
  `motion` values; React state only changes when a new card reaches the front), `PresetCard.tsx`
  (card, label, butterfly `<symbol>`), `DescriptionLabelRow.tsx`, `useFormPresets.ts` (layer state,
  `inert` on the form), `src/lib/presetApply.ts` (the Apply rules).
- `LulyssiaConfirmDialog` got an optional third answer (`secondaryText` / `onSecondary`).
- The app already had `framer-motion`; `motion` was added as the plan says (they share their core).
