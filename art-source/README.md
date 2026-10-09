# Art sources

Original PNGs of Lulyssia's art. The app never imports these; it uses the WebP copies at the same path under `src/assets/` (for example `art-source/emote/lulyssia_yes.png` → `src/assets/emote/lulyssia_yes.webp`).

- Stickers (`emote/`): lossless WebP, 512px max — `cwebp -lossless -z 9 [-resize 512 0] in.png -o out.webp`
- Large art (`image/`): high-quality lossy WebP, since lossless is about twice the size at these dimensions

`lulyssia_sitting_border.png` has no WebP yet (not used in the app).
