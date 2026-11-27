# 4. The apply moment

**Status:** Built
**Branch:** `plan/presets/4-moment` (on item 3's branch: merge `1-data`, `2-settings`, `3-cards` first)

## Done when
Checked in a browser (Playwright) on the same test page as item 3, timing each step every 10ms.
- [x] the moment plays after Apply (and after the description question's answer), then the form
      is filled, and it fades out — the layer went, the moment showed within 40ms (focus on its
      Skip); the title was still empty until about 1.3s, then filled; the moment faded out and was
      gone by about 1.75s, and the focus went back to "Presets". After answering "Replace" to
      Lulyssia's question the moment played the same way. The running animations were Lulyssia's
      rise, the card's hold-and-melt and the sparkles.
- [x] "Skip" ends it at once with the form filled the same way — Skip at 0.4s filled the form
      straight away (same `onApply` as the timer) and started the fade-out.
- [x] with reduced motion on, it doesn't play — no moment; the form was filled at once and the
      layer closed.
- [x] typecheck, lint and build pass.

## Owner checks by eye
- The moment: Lulyssia rising, the card turning to light with the sparkles, and the fade over the
  filled form.

## Assumptions
- **Esc during the moment** works like its Skip (fills the form and fades out).
- **The form stays blocked** during the moment too (as during the layer), and is usable again once
  the moment has faded.
- **No sound** of its own: the success sound already plays on "Apply preset".
- **Card size** in the moment: up to 230px wide (60% of the screen on phones), as in the preview.

## Needs
Nothing more.

## Notes
- `src/components/dashboard/PresetMoment.tsx`; the timings are in `src/index.css` with the other
  preset animations (inside the reduced-motion block).
