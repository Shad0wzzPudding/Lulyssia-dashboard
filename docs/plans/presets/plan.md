# Plan: presets

**Status:** Ready to build <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `5922c3f` (2026-11-27)
**Decided with the owner on:** 2026-11-27

## Goal

Ready-made setups ("presets") for tasks and events. In the task or event form, a "Presets" button
opens a stacked carousel of cards; picking one and pressing "Apply preset" fills in the form: its
name as the title (if empty), its description format, its tags, and a Deadline/End worked out from
the start. Presets are made, changed and deleted in a new "Presets" card in Settings, from the
carousel's "+", or from a card's details.

(The owner's working name was "Tag present"; on screen it's "Preset".)

## Not in this plan

- Presets for interests or daily tasks; sharing presets with other people.
- Presets that set the repeat, "Mark as completed", "Notice before" or attachments.
- New sound files (the existing sounds are used).
- Recent Changes entries or undo for presets; LINE messages about presets.
- A limit on how many presets there can be.

## Items

Build them in this order. Each one is its own branch. Items 2 to 4 depend on the ones before them.

### 1. Where presets are kept

- **Branch:** `plan/presets/1-data`
- **What it does:** nothing visible yet. A new `presets` table and a data hook, so presets are kept
  with the account (on every device), like tags.
- **Rules decided:**
  - New migration `supabase/migrations/<timestamp>_presets.sql`:
    - table `public.presets`: `id uuid primary key default gen_random_uuid()`, `user_id uuid not
      null`, `name text not null` (trimmed, 1 to 40 characters: a check), `description text not
      null default ''` (the format, stored exactly as the description editor stores text),
      `tag_ids uuid[] not null default '{}'`, `due_amount integer` (1 to 999, or null for no due
      date), `due_unit text` (`'hours' | 'days' | 'weeks'`, null exactly when `due_amount` is
      null: a check), `use_count integer not null default 0`, `created_at` / `updated_at
      timestamptz not null default now()`;
    - row level security on, one policy `for all to authenticated` with both `using (auth.uid() =
      user_id)` and `with check (auth.uid() = user_id)`, like `tags`;
    - the `update_updated_at_column` trigger, like `tags`;
    - deleting a tag also takes it out of every preset's `tag_ids`: extend the trigger function from
      `20261015000001_deleted_tags_leave_items.sql`: redefine `public.remove_deleted_tag_from_items()`
      in the new migration with the same body plus `update public.presets set tag_ids =
      array_remove(tag_ids, old.id) where user_id = old.user_id and old.id = any(tag_ids);`, and
      repeat its `revoke execute … from public, anon, authenticated` (the trigger itself stays).
  - Names don't have to be unique.
  - `src/hooks/usePresets.ts`, modelled on `src/hooks/useTags.ts`: query key `['presets']`, the
    list ordered by `use_count` (most used first), then `created_at` (older first, so new ones
    start at the end); `createPreset`, `updatePreset`, `deletePreset` (with toasts on failure, like
    tags) and `countUse(id)` (adds 1 to `use_count`). A second create while the first is still
    saving is ignored (the double-Enter guard tags have). `useTags`'s `deleteTag` also invalidates
    `['presets']`, so a deleted tag leaves the presets on screen at once.
  - `Preset` type in `src/lib/types.ts`; `src/integrations/supabase/types.ts` gets the table.
- **Preview:** none.
- **Done when:**
  - [ ] the migration runs on a copy of the schema (PGlite or a local Supabase) after the existing
        ones, and its checks refuse a 41-character name, `due_amount` 0 and a unit without an
        amount;
  - [ ] another user's presets can't be read, changed or deleted (a test with two users);
  - [ ] deleting a tag removes it from the presets that had it;
  - [ ] typecheck, lint and build pass.
- **Owner checks by eye:** none.
- **Needs:** migration `<timestamp>_presets.sql`, applied by the owner before merging items 2 to 4.
- **Depends on:** nothing.

### 2. Presets in Settings, and the preset form

- **Branch:** `plan/presets/2-settings`
- **What it does:** a new "Presets" card in Settings with every preset, most used first, a
  "+ New preset" button, and a pencil and a trash button on each row. "+ New preset" and the
  pencil open the preset form.
- **Rules decided:**
  - **Place:** right after Tag Management (owner's choice). Settings cards alternate black and
    white, so Presets is white (`theme-light`) and the cards after it each swap: Display becomes
    black, Sound white, Editor black.
  - **Card:** title "Presets" with a cards icon; the line "Ready-made setups for a task or an event.
    Pick one with "Presets" in the form."; "+ New preset"; then one row per preset: a stripe in its
    first tag's colour (grey with no tag), its name, its tag chips, "Due: start +3 days" (or "No
    due date") and "used 9×", with a pencil ("Edit preset <name>") and a trash ("Delete preset
    <name>"). With none: "No presets yet. Make one to fill a task or event in one tap."
  - **Form** (a dialog like the task form, titled "New Preset" / "Edit Preset", buttons
    "Create"/"Update" and "Cancel"). Build it as one component,
    `src/components/dashboard/PresetFormDialog.tsx`, opened with a handle's `openNew()` /
    `openEdit(preset)` like `TaskFormDialog`, and taking an `onSaved(preset)` callback: Settings
    uses it here, and item 3 opens the same one from the carousel's "+" and a card's details.
    - Name: required, at most 40 characters; empty: "Give the preset a name." under it.
    - Description format (optional): the same `FormattedTextarea` as a task's description.
    - Tags (optional): the same `TagPicker` (a new tag can be made there too).
    - Due date: a switch "Set the Deadline / End from the start" (on for a new preset), and with it
      on, "Start +" a number box (1 to 999, whole numbers; an empty or 0 box saves as 1) and a unit
      select (Hours, Days, Weeks; Days first). A line under it says what picking the preset will do:
      "Picking this preset sets the Deadline (task) or End (event) to the start + 3 days. With no
      start yet, the start becomes now." / with the switch off: "Picking this preset leaves the
      Deadline / End as it is."
    - Saving waits for the answer ("Saving…"), stays open with everything kept on a failure, and
      refuses offline, like the task form (`refuseSaveOffline`). The 16px-on-phones rule for text
      boxes applies.
  - **Delete:** asks first with Lulyssia's usual question (`LulyssiaConfirmDialog`): "Delete the
    preset "<name>"? Tasks and events already made with it stay as they are." / "Yes, delete it"
    and "Cancel"; plays the delete sound.
  - Sounds as the task form: edit sound on opening to edit, success / update on saving, cancel on
    Cancel.
- **Preview:** `previews/preset-form.html`, published at
  https://claude.ai/artifact/N2mi5pwoWsEfvGoh8N9bJ8. Intent only: use the app's real Settings
  card, editor, tag picker and confirm dialog.
- **Done when:**
  - [ ] a preset can be made, changed and deleted from Settings, and the list shows it (most used
        first, new ones at the end);
  - [ ] an empty name can't be saved; 41 characters can't be typed;
  - [ ] the switch off saves no due date; on, it saves the number and unit;
  - [ ] the cards after Presets swap black/white as above;
  - [ ] at 360px nothing widens the page, and a one-long-word name or tag wraps inside its row;
  - [ ] typecheck, lint and build pass.
- **Owner checks by eye:** the Presets card (desktop and phone), the form, the swapped colours of
  Display, Sound and Editor.
- **Needs:** item 1's migration applied.
- **Depends on:** 1.

### 3. The preset cards in the task and event forms

- **Branch:** `plan/presets/3-cards`
- **What it does:** a "Presets" button in the task form and the event form (new and edit). Today
  neither form has a label over its description box (only the "Description (optional)"
  placeholder), so add a row just above the box: "Description" on the left, styled like the forms'
  other labels ("Tags"), and "Presets" (small, outline, a cards icon) on the right. It opens a full-screen layer: a banner "Choose 1 preset", a stacked
  carousel of preset cards, and "Skip" / "Apply preset" at the bottom right. Tap the front card to
  pick it, then "Apply preset" fills the form.
- **Rules decided:**
  - **One shared list:** both forms show every preset (owner's choice).
  - **Stacking:** the task and event forms are Radix dialogs, so build the layer as a Radix `Dialog`
    too (its content full screen), so it stacks over the form; item 2's form and Lulyssia's
    questions then stack over the layer, and Esc closes only the top one.
  - **The form behind is blocked** (owner's ask): while the layer is open (and during item 4's
    moment and Lulyssia's description question), nothing behind it can be used: no clicks or taps,
    no typing, no scrolling the form or the page, Tab never reaches it, and screen readers skip it
    (a modal dialog: Radix's focus trap and outside-pointer block, plus `inert` on the form
    dialog's content while the layer is up). Only the layer's own controls work; the form comes
    back to life when the layer closes.
  - **The layer:** full screen over the form, dark (the app's dark page colour at about 94%,
    a light blur). At the top a cyan banner, slanted at its right end, with a dark icon block, "Choose
    1 preset" in the app's slanted display font, the hint "Hold a card (or ⓘ) to read all of it"
    (hidden under 600px) and a "+" button ("New preset"). At the bottom, "Skip" (light) and "✓ Apply
    preset" (cyan, slanted; greyed out until a card is picked).
  - **Stacked carousel** (owner's choice, from a stacked card carousel component the owner shared):
    - the front card in the middle; the others fanned to each side behind it, each step further out,
      lower, tilted, smaller and darker; it loops (after the last comes the first);
    - per step: under 640px 90px across, 20px down, 8° tilt, 6% smaller; 640 to 1023px 130px, 30px,
      10°, 9%; from 1024px 170px, 40px, 12°, 12%; cards further back are darkened up to 50%; cards
      more than half the stack away fade out;
    - drag or swipe sideways moves it; letting go springs to the nearest card (a flick moves up to
      3 cards); ‹ › round buttons at the sides, ← → keys and tapping a card behind bring cards to
      the front; a line under the stack reads "2 of 7: Lab report" (read out politely);
    - build it with the `motion` package (owner's choice: add it as a dependency and adapt the
      pasted component's `useMotionValue` / `useTransform` / `animate` spring and drag), in
      `src/components/dashboard/PresetCarousel.tsx`; the order is the hook's (most used first), so
      the most used preset is in front when it opens;
    - moving the stack must not redraw the cards: each card's position, tilt, size, darkness and
      layer order come from `motion` values (`useTransform`), which change the styles directly
      without a React re-render; a drag never sets React state per frame. The butterfly is one
      SVG `<symbol>` on the page, shown on each card with `<use>`.
  - **The cards** (owner's design, worked out in `previews/card-designs.html`, card "F"): flat and
    cartoon, in black, white and light blue (`#4fc3f7`), from the owner's reference picture. About
    176 to 256px wide, 2:3, corners 6px.
    - **Card:** glossy black (a gradient from `#15181c` to `#050607`, with a faint white diagonal
      shine across it), a 2px silver-white edge (`#d9dee3`) with a 2px black ring outside it, and a
      hard light-blue shadow (7px 7px, `#4fc3f7`). No coloured stripe at the side.
    - **Comic dots:** light-blue dots (`#4fc3f7` at 70%, 1.3px dots on a 9px grid) over the card,
      full at the bottom and fading out towards the top (a dark overlay from the top, gone by about
      85% of the way down).
    - **Name slab:** across the top, a white frosted-glass slab (white to a pale blue-grey, about
      90% opaque, a light blur behind it) with a slanted bottom edge (the right side about 28%
      higher than the left); the name on it in black, large, in the slanted display font, with room
      for the ⓘ. Under the slab, following its slant all the way across, a 5px band in the card's
      first tag colour (light blue with no tag).
    - **Inside:** the description format as plain text in near-white (the formatting marks taken
      out with `parseChars` from `src/lib/inlineFormat.ts`, as `searchItems` does), cut off with a fade; the due
      offset on a small tag with a 2px black outline: "+3 days" in black on light blue, "No due date"
      in black on silver. The tag chips are not on the card (the label shows them).
    - **Butterfly:** a white butterfly drawn in code (SVG, black outlines, faint wing lines, curled
      antennae, a small diamond charm hanging from a wing, a hard black shadow), about 50px wide in
      the bottom-right corner, angled like the owner's picture; see `previews/card-designs.html`
      for the drawing. One `<symbol>`, shown on each card with `<use>`.
    - **ⓘ:** a round white button with a black outline at the top right, a separate button next to
      the card (not inside it).
  - **The label above each card** (owner's choice): one slanted tab per tag in the tag's colour with
    its name in the display font and a hard black shadow; "No tag" in grey with none. When the tag
    names together are longer than 16 letters and there are more than two tags, only the first two
    show, then a "…" tab (its title lists every tag). Each tab shortens itself with "…" if the row
    is still too wide, so the label never gets wider than its card. Text on the tab is dark or white,
    whichever reads better on that tag's colour. The label moves, tilts and darkens with its card.
  - **Picking:** tapping (or Enter / Space on) the front card picks it: it lifts 8px with a black
    ring, a light-blue ring and a light-blue glow outside it, and a round cyan check in the middle;
    tapping it again unpicks it. A tap right after a drag does nothing. Moving the stack keeps the
    pick on its card.
  - **Details:** holding a card half a second, or its ⓘ, opens a big card: the name, the whole
    format as it will look (with `FormattedText`, as the app shows descriptions), all tags, "Due: start +3 days" / "No due date", and the buttons "Pick
    this one", "Edit", "Delete", "Close" (owner's choice: edit and delete from here too). Edit opens
    item 2's form; Delete asks first as in item 2. Esc or a tap outside closes it. Moving the finger
    more than 6px cancels the hold (it's a drag), and a long press doesn't open the phone's own
    menu or select text. After Edit, the card shows the changes in place; deleting the picked
    preset unpicks it; deleting the last one shows the "No presets yet" screen.
  - **"+":** opens item 2's form over the layer; after "Create" the layer comes back with the new
    preset brought to the front.
  - **No presets yet:** the layer shows Lulyssia (the "contemplate" sticker) with "No presets yet.
    Make your first one!" and a "+ New preset" button instead of the stack.
  - **Apply preset** (all owner's choices):
    - **Title:** an empty title (only spaces counts as empty) gets the preset's name; a typed title
      stays.
    - **Description:** an empty description gets the format. If it already has text, Lulyssia asks
      first (`LulyssiaConfirmDialog` has only two buttons today: give it an optional third, e.g.
      `secondaryText` / `onSecondary`, keeping its look and random line; other uses don't change): "The description already has text. Add "<name>" below it, or replace it?" with "Add
      below" (first, focused), "Replace" and "Cancel". "Add below" puts the format after a blank
      line; Cancel leaves the form and the layer as they were.
    - **Tags:** the preset's tags are added to those already picked; none are removed.
    - **Due:** with a due offset, the Deadline (task) or End (event) becomes the start + X, to the
      minute (`addHours` / `addDays` / `addWeeks`). With no start yet, the start becomes now (to the
      minute). After that, changing the start by hand moves the Deadline/End to the new start + X
      (instead of the usual +5 hours) until the Deadline/End is changed by hand. Without a due
      offset, the dates are left as they are.
    - Nothing else in the form changes (repeat, done, notice, files).
    - The preset's `use_count` goes up by 1 (once per Apply). The form isn't saved; the person still
      presses Create/Update.
  - **Entrance:** when the layer opens, the banner slides in from the left and the cards (with
    their labels) slide down from above one after another (0.5s each, 90ms apart, a small bounce).
  - **Closing:** "Skip" or Esc fade the layer out (0.38s) with no changes; the focus
    goes back to "Presets".
  - **Sounds** (owner's choice: the existing ones, following the Settings sound switch and volume):
    opening the layer: the expand sound; picking a card: the edit sound; Apply: the success sound;
    Skip: the cancel sound.
  - Reduced motion: no slide-in, no fades, the stack moves without the spring (it jumps).
  - The layer is a dialog (focus kept inside it; Tab reaches the banner's "+", the front card, its
    ⓘ, ‹ ›, Skip and Apply).
- **Preview:** `previews/preset-cards.html` ("Version 3"), published at
  https://claude.ai/artifact/QpM2XpnLibYaZt8TAuTErr. Intent only for the look (use the app's real
  parts and fonts); the carousel's step sizes, the label rule and the animation timings are exact.
  Versions 1 and 2 there were not chosen. The card: `previews/card-designs.html` (card "F"),
  published at https://claude.ai/artifact/2LpwqdEkCuS7bxWm5xSuSF; exact for the colours, the slab,
  the dots and the butterfly (the other cards there were not chosen).
- **Done when:**
  - [ ] "Presets" shows in the task and the event form, new and edit, and opens the layer with
        every preset, the most used in front;
  - [ ] dragging, flicking, ‹ ›, ← → and tapping a card behind all move the stack, and it loops;
  - [ ] Apply follows every rule above (title only when empty; the description question with its
        three answers; tags added; Deadline/End = start + X, start = now when empty, and the
        following start change keeps + X); `use_count` goes up by 1;
  - [ ] the label shows every tag up to 16 letters, and the first two plus "…" beyond (with three
        or more tags), and never gets wider than its card at 360px;
  - [ ] details open with a half-second hold and with ⓘ; Edit and Delete work from there; "+"
        makes a preset that then shows in front;
  - [ ] with no presets, the empty message and "+ New preset" show;
  - [ ] keyboard only: the whole flow works with Tab, Enter, Space, ← → and Esc;
  - [ ] while the layer is open, clicking, tapping, typing, scrolling and Tab can't reach the form or
        the page behind it (check on a phone too), and the form works again once it closes;
  - [ ] with reduced motion on, nothing slides or fades;
  - [ ] `motion` is added to package.json; typecheck, lint and build pass.
- **Owner checks by eye:** the "Description" row with "Presets"; the layer, the stack and its feel
  when dragging (desktop and phone); the card (black, white and light blue, the tag-colour band
  under the name, the dots, the butterfly); the labels; the slide-in and fade-out; the sounds.
- **Needs:** item 1's migration applied; `npm install` (new package `motion`).
- **Depends on:** 1, 2.

### 4. The apply moment

- **Branch:** `plan/presets/4-moment`
- **What it does:** after "Apply preset", Lulyssia holds the picked card up while it turns to light,
  then everything fades out over the filled-in form (about 1.6s in all; "Skip" ends it at once).
- **Rules decided:**
  - The layer goes; a dark screen (a dark cyan glow in the middle, black at the edges) with
    Lulyssia's "ritualing" sticker (`STICKERS.ritualing`) rising from the bottom (0.4s) and the
    picked card above her.
  - The card (1.2s): rises in (0 to 25%), glows brighter and grows a little (to 60%), then melts
    into light (brighter, blurred, bigger, gone by 85%). About 14 small sparkles burst out from the
    card from about 0.35s.
  - No white flash (owner's choice: removed).
  - At 1.25s the form is filled in underneath and the moment fades out (0.38s), so the filled form
    shows through (owner's choice).
  - "Skip" at the bottom right fills the form and fades out at once.
  - Reduced motion: no moment; the form is simply filled.
- **Preview:** `previews/preset-cards.html`: "Apply preset" in any version. Exact for the timings,
  intent only for the look.
- **Done when:**
  - [ ] the moment plays after Apply (and after the description question's answer), then the form
        is filled, and it fades out;
  - [ ] "Skip" ends it at once with the form filled the same way;
  - [ ] with reduced motion on, it doesn't play;
  - [ ] typecheck, lint and build pass.
- **Owner checks by eye:** the moment (Lulyssia, the card turning to light, the fade).
- **Needs:** nothing more.
- **Depends on:** 3.

## Questions answered while planning

- **Q:** What are they called on screen? **A:** "Preset" ("Presets", "New preset").
- **Q:** Shared between tasks and events? **A:** One shared list; both forms show every preset.
- **Q:** Does the name fill the title? **A:** Only when the title is empty.
- **Q:** The description already has text? **A:** Ask first: add the format below it, or replace it.
- **Q:** Tags? **A:** The preset's tags are added to those already picked; none are removed.
- **Q:** How is the due offset entered? **A:** A number and a unit (Hours, Days, Weeks), optional.
  Picking the preset sets the Deadline (task) or End (event) to start + X.
- **Q:** No start yet? **A:** The start is filled with now, and the Deadline/End with now + X.
- **Q:** How do the cards appear? **A:** Like the owner's reference recording (a game's card-pick
  screen), in the app's own style with Lulyssia, not the game's art: pick, then "Apply preset"
  ("Skip" closes); hold a card (or ⓘ) for its details; an apply moment. The first try also had a
  row per tag, dropped later.
- **Q:** Which layout, after trying three? **A:** Version 3, a stacked carousel (the owner's
  reference: a stacked card carousel component). The tag rows (Version 1) and one row of big
  glowing cards (Version 2) were dropped. The cards keep Version 1's cartoon look.
- **Q:** The card's design? **A:** Worked out over several tries (`previews/card-designs.html`):
  first Version 1's dark card with comic dots and a black name slab; then a glass-grey slab and
  dots full at the bottom fading up; then, from the owner's reference picture, black, white and
  light blue (card "F"); the line under the name in the tag's colour (slanted with the slab); the
  butterfly first drawn, then the owner's own picture, then drawn in code again, all white. A
  picture file was tried and dropped: nothing to add to the app's images.
- **Q:** How do the cards come in? **A:** They slide down from above, one after another.
- **Q:** The apply moment's white flash? **A:** Removed. Lulyssia, the glow and the sparkles stay.
- **Q:** Fades? **A:** The apply moment fades out over the filled form; Skip/Esc fade the layer out.
- **Q:** A category label? **A:** Yes, above each card: a slanted tab per tag; past 16 letters in
  all, the first two and "…".
- **Q:** Order? **A:** Most used first; new ones start at the end.
- **Q:** Where can a preset be edited or deleted? **A:** In Settings, and from a card's details.
- **Q:** The Settings card and the form? **A:** As in the preview: right after Tag Management (the
  cards after it swap black/white).
- **Q:** How is the carousel built? **A:** With the `motion` package (added as a dependency).
- **Q:** Sounds? **A:** The existing ones: expand on open, edit on pick, success on Apply, cancel on
  Skip.
- **Filled in by Claude while planning (owner to object if wrong):** names needn't be unique; the
  empty-carousel message with Lulyssia's "contemplate" sticker; after "+", the new preset comes to
  the front; a changed start keeps start + X until the Deadline/End is set by hand; Apply doesn't
  save the form; delete asks with Lulyssia's usual question; no Recent Changes for presets.
- **Found while checking the plan against the code (27 Nov 2026):** the forms have no
  "Description" label today, so item 3 adds one with "Presets" beside it; Lulyssia's question has
  two buttons, so it gets an optional third for "Add below / Replace / Cancel"; the app doesn't
  handle the phone's back button for dialogs, so only Skip and Esc close the layer; the preset form
  is one shared component; deleting a tag refreshes the presets too.
- **Q:** Can the form behind the cards be used while they're open? **A:** No (owner's ask): it's
  blocked completely until the layer closes.

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

1. Apply migration `supabase/migrations/<timestamp>_presets.sql` (item 1) before merging items 2 to 4.
2. Item 3 adds the `motion` package: Vercel installs it on deploy; run `npm install` locally.
3. Front end otherwise; out with Vercel when merged. Merge order: 1, 2, 3, 4.

## Summary

`summary.html`: the whole build at a glance (now → after), published at https://claude.ai/artifact/4BwuiY8qFVik2cbX7ER3KZ
