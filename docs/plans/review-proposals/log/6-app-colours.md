# 6. Installed app's colours

**Status:** Built
**Branch:** `plan/review-proposals/6-app-colours` (based on `main`)

## Done when
- [x] public/manifest.json has the two new colours and is still valid JSON — `background_color` `#080b0c`, `theme_color` `#3aafcf`; parsed with Python's `json` module
- [x] the hex values match `--background` and `--primary` in src/index.css — `--background: 200 20% 4%` and `--primary: 193 61% 52%`, converted by the browser itself (Chromium's computed colour: rgb(8, 11, 12) and rgb(58, 175, 207)) and by Python's `colorsys`; both give the same values
- [x] build passes — `npm run build`

## Owner checks by eye
Open the installed app on Android (may need reinstalling the app, or waiting for it to update, before the new colours show).

## Assumptions
- The exact conversions differ slightly from the plan's "about" values (`#080c0e` and `#3aadd0`); the plan asked for the exact conversion, so the manifest uses `#080b0c` and `#3aafcf`. (`#3aadd0` is the hand-picked cyan named in index.css's comment; `--primary` rounds to `#3aafcf`.)

## Needs
nothing

## Notes
Only public/manifest.json changed.
