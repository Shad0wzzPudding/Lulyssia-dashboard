# 3. Page-change train and the device's "reduce motion" setting

**Status:** Built
**Branch:** `plan/review-proposals/3-reduce-motion-train` (based on `main`)

## Done when
- [x] with reduced motion emulated (prefers-reduced-motion: reduce), changing page shows no train and plays no train sound — browser check (Playwright `reducedMotion: 'reduce'`, "Page transitions" saved as on): two page changes, the train's picture never appeared and the 5.6-second train sound never started; the page still changed
- [x] without it, the train works as before and follows the Settings switch — same check without reduced motion: switch on → train seen and train sound started on each change; switch off → no train, no train sound
- [x] Settings shows the switch off and disabled with the note while reduced motion is on — browser check: switch unchecked and disabled, note "Your device asks for less motion, so page transitions are off."; the saved value stayed "true"; without reduced motion the switch shows on and can be changed
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the two changed files, `npm run build`

## Owner checks by eye
A page change with the device's reduce-motion setting on and off, and the note in Settings → Animating menu.

## Assumptions
- Note wording: "Your device asks for less motion, so page transitions are off." (the plan gave the start, "Your device asks for less motion, so…", matching the "Reduce flashing" note).

## Needs
nothing

## Notes
`usePageTransitions()` (used by the page changes) now also checks the device setting; Settings reads the switch itself through a new `usePageTransitionsSetting()`.
