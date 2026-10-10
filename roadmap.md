# Roadmap
- [x] LINE missed-deadline nudges
- [x] Notice before option + separate day-before message

## Backlog
- [ ] LINE stickers: send a real LINE sticker with Lulyssia's sign-off (sticker message after the daily digest)
- [ ] LINE Flex Messages: show the daily digest, reminders and overdue nudges as Persona 5 styled cards instead of plain text

## Backlog from the bug hunt (need a decision before changing)
- [x] Clean up unused attachment files: removing an attachment no longer deletes the file (it could still be used by a copy or an undo), so add a server-side job that deletes stored files no task, event or interest points to anymore
- [x] "Overdue" vs "Today": a task due earlier today counts under Home's "Today's Tasks" but under "Overdue" on the Tasks page. Pick one rule for both
- [x] Select mode "All" selects every item on the page, including items hidden by the search or tag filter, so a batch delete can remove items you can't see. Suggest: "All" selects only the visible items
- [x] LINE "today" command: when the daily message is turned off ("stop"), Lulyssia says she'll send today's list but nothing arrives (the digest only goes to links with the daily message on). Decide: always send on request, or reply that the daily message is off
- [x] LINE "today" command starts the digest without waiting for it; the function may be stopped before that request goes out. Use `EdgeRuntime.waitUntil` (needs a function deploy to test)
- [x] Missed-deadline nudges: Settings says "an unfinished task or event", but only tasks get nudged. Either add events to `send-line-overdue` or change the Settings text
- [x] Drag to reorder ("User sort") while a search or tag filter is on renumbers only the visible items from 0, so they collide with the hidden ones and the full order is mixed up once the filter is cleared. Fix needs a change in how order numbers are given out (e.g. reuse the items' existing numbers)
- [x] Switching pages keeps the scroll position, so a page picked while scrolled down opens part way down. Suggest: scroll to the top while the transition covers the screen
- [x] Remove `SwipeableInterestCard` (imported on Home but never shown)
- [x] Bundle was about 980 kB in one file: libraries now load as separate cached files (largest file 236 kB)
- [x] Images: `lulyssia_trigger_chibi.png` (1.9 MB, shown at 80px) and `lulyssia_trigger.png` (1.6 MB) could be WebP like the other art to load much faster

## Persona theme polish (menu and drawer)
Goal: feel more like a Persona 3 / 5 game menu. Suggested order: 1 and 2 first.

1. More real choices in the side drawer, so the scene has more to show than one link
   - [x] Sign out (moved from the header)
   - [x] About Lulyssia link (opens the About page)
   - [x] ~~Quick "Animating menu" on/off switch~~ dropped: tried as a 4th row and as a header chip, both crowd the drawer and Lulyssia's art covers the buttons; the switch stays in Settings
   - [ ] LINE status (linked / not linked, daily message on or off)
   - [ ] Bigger, bolder items in the same slanted bubble style as the message menu choices
2. Game-style cursor in the message menu and the drawer
   - [x] Up/Down arrow keys move between choices, Enter picks one
   - [x] A highlight that slides from choice to choice
   - [x] A soft tick sound on each move or hover
3. [x] More dramatic drawer opening: a fast diagonal slash wipe (about 0.3 s), then the items snap into place, instead of the current fade-in scene and plain slide-in panel
4. [x] ~~Less clutter in the drawer scene (about eight effects at once now)~~ kept as is: the drawer scene looks right as it is (bubbles, dotted wedge and KEEP OUT tape stay)
5. [x] ~~A calm Persona 3 touch: a slow light ripple moving across the drawer's water~~ dropped: a light sweep was tried, but the drawer is busy enough that it was barely noticeable
6. [x] Persona 5-style mixed-letter title for "MENU" only: each letter in its own slanted cut-out block (our own lettering in that style, not taken from the games)
7. [ ] Readability: Lulyssia's art sits in front of the drawer items (her layer is above them on purpose), so on short screens keep the items clear of her art instead of adding a backing behind them
