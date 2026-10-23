# 2. About page 5px too wide on 320px phones

**Status:** Built
**Branch:** `plan/review-proposals/2-about-narrow-phones` (based on `main`)

## Done when
- [x] at 320px the About page is no wider than the screen (document scroll width ≤ 320) — browser check: 327 before, 320 after; also 340 → 340 and 359 → 359
- [x] at 360px, 390px and a computer width the card looks unchanged (same tilt and margins) — browser check of the card's computed padding (20px all round) and tilt (same skew matrix) at 360, 390 and 1280px, the same as before the change
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint src/components/dashboard/AboutLulyssiaCard.tsx`, `npm run build`

## Owner checks by eye
The About page on a narrow phone (or a 320px browser window).

## Assumptions
- The plan offered "a little less tilt or side margin". Measuring showed the tilt isn't what sticks out: at 320px the text column beside the portrait is only about 80px wide and a word in it reaches about 7px past the screen. Less tilt wouldn't fix that, so the card's side padding goes from 20px to 12px below 360px (top and bottom stay 20px). That is the smallest change that fits, and the card keeps its tilt and shape.

## Needs
nothing

## Notes
Only the large card on the About page changes; the small card elsewhere keeps its padding.
