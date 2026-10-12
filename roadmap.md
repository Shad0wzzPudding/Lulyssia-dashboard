# Roadmap
- [x] LINE missed-deadline nudges
- [x] Notice before option + separate day-before message

## Backlog
- [x] LINE stickers: send a real LINE sticker with Lulyssia's sign-off (sticker message after the daily digest). Done as Lulyssia's own sticker art sent as an image: bots can only send LINE's official sticker packs
- [x] LINE Flex Messages: show the daily digest, reminders and overdue nudges as Persona 5 styled cards instead of plain text
- [x] LINE notice-before message as a card too: the morning letter's layout (sections, item boxes, tag chips) with its own "Tomorrow" banner
- [x] "Done" button on the missed-deadline card: marks the task finished straight from LINE (a postback the LINE webhook handles), then Lulyssia confirms in the chat
- [x] Home page: remove the separate "Today's Summary" section and show its counts (today's tasks, completed, today's events, overdue) inside the "Today Events" section instead
- [x] Home page: move the Upcoming Events section up into the Interests section's place, and move Interests down below it
- [x] Home page: new "In progress..." section under "Today Events", listing the tasks and events that have already started and run longer than one day (started before today and not finished yet)

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

Second bug hunt (12 Oct 2026), most serious first:
- [ ] Repeating tasks disappear from LINE after you tick them: a repeating task only resets to "not done" when the dashboard is opened after its deadline. Until then it stays "done", so the morning letter and the "starting soon" reminders skip the next round. Example: a daily 20:00 task ticked on Monday is missing from Tuesday's 08:00 letter unless you opened the app on Monday night. Suggest: do the reset on the server (a small scheduled SQL job, or in the LINE functions before they read tasks) instead of only in the browser
- [ ] "Clear Past" on the Events page can delete events that are still running: "past" only looks at the start time, so an event that started yesterday and ends next week is listed under Past Events (while Home shows it under "In progress...") and "Clear Past" deletes it. Suggest: an event is past only when it has ended (its deadline, or its start if it has no deadline, is before today), and show running events in their own group on the Events page
- [ ] "Clear Completed" deletes repeating tasks for good: a repeating task ticked done for this round counts as completed, so clearing removes the whole series instead of letting it come back next round. Suggest: leave repeating tasks out of "Clear Completed" (or reset them to their next round instead)
- [ ] Undo after "Clear Completed" / "Clear Past" can bring items back twice: the Undo button makes new copies (new ids), but Recent Changes still lists the original "deleted" entries, and undoing one of those puts the original back too. The copies also lose their drag order and creation date. Suggest: Undo puts back the original rows (same ids, all fields), so the Recent Changes entries then fail safely instead of duplicating
- [x] Changing the start time while editing resets the deadline: on both Tasks and Events, any change to Start sets the deadline to start + 5 hours, even when the item already had its own deadline (e.g. moving the start of a week-long task cuts it to 5 hours without saying so). Done: the deadline follows the start only while it is empty or still the filled-in value (start + 5 h), so a deadline set by hand is kept
- [x] Two scheduled LINE functions depend on a deploy flag nobody wrote down: `supabase/config.toml` marks only line-webhook, send-line-daily and cleanup-attachments as callable without a login. send-line-overdue and send-line-reminders (and line-bot-info, line-rich-menu) are not listed. They are correct on the live project today (checked), but deploying them without `--no-verify-jwt` would make the cron calls fail with 401 and the nudges and reminders would stop with no visible error. Suggest: add those four to `config.toml` with `verify_jwt = false`
- [ ] The attachment clean-up almost never deletes anything, and Recent Changes grows forever: every edit saves the old version (with its attachments) in the activity log, the clean-up treats files listed there as still in use, and the log is never trimmed (the app shows only the last 10). Suggest: trim activity log entries older than e.g. 30 days in the same nightly job, so removed files can then be cleaned up
- [x] A LINE nudge that fails to send is never retried: missed-deadline nudges and the morning repeats are marked "sent" before the push. If LINE refuses both the card and the plain-text version, that nudge is lost. Suggest: remove the "sent" mark when both sends fail, so the next 5-minute check tries again
- [x] Copying a task or event drops "Notice before": Copy and the select-mode batch copy leave out that setting, so the copy gets no day-before message. Suggest: copy `notice_before` too
- [x] Repeating tasks that start between 00:00 and 00:15 (Thai time) never get a "starting soon" reminder: the check 10–15 minutes ahead runs before midnight but only looks for repeats on the current day. Suggest: also check the next day's repeat when the window crosses midnight
- [ ] Monthly repeats on the 29th–31st drift: renewing a task due 31 Jan moves it to 28 Feb, then 28 Mar, 28 Apr… for good. Suggest: count each new deadline from the first deadline's day of the month instead of from the previous (shortened) one
- [x] Security (low): the LINE functions trust the file paths stored in a task or event and sign them with full access. Someone who changes their own item through the API to point at another account's file would get that file sent to their LINE. The paths contain a random id, so they would need the exact path. Suggest: only send files whose path starts with the item owner's user id
- [ ] LINE Settings: the refresh-code button also unlinks LINE, with no warning. After linking in LINE, "Not linked yet" stays on screen until the page is reloaded. Suggest: confirm before unlinking (or say "New code (unlinks LINE)"), and check the link again when the app comes back into view
- [ ] Turning off the "Daily message" also quietly turns off "Notice before" and the daily missed-deadline repeats: both only go out with the 08:00 run, which skips anyone with the daily message off. The "Notice before" switch on each task and event still shows and promises a heads-up. (It is also shown on repeating tasks, which never get one.) Suggest: send the notice and the repeats at 08:00 even when the letter itself is off, and hide the switch on repeating tasks
- [ ] Drag to reorder ("User sort") on Tasks, Events and Interests uses mouse-only dragging: those lists have no touch handling (unlike the Home cards, which do), so on many phones the cards can't be dragged at all. Suggest: check on the phone first; if it doesn't work, add touch dragging (or up/down buttons)
- [x] Scrolling on a phone can shuffle Home's four count tiles: any touch on a tile starts a drag right away, and moving the finger (even a normal up/down scroll) picks a drop target by left/right position only. On a phone the tiles wrap into two rows, so the tile below in the same column also matches, and letting go swaps them. The new order is saved. Suggest: ignore mostly-vertical moves (like the Recent Changes swipe does) and pick the target by both position axes, or start the drag only after a long press
- [ ] A short connection drop can throw away an open form: when the app comes back into view it reloads its data, and if that reload fails (e.g. the phone is briefly offline), the whole dashboard is replaced by "Something went wrong… please refresh". Any open add/edit form and what was typed in it is lost, even though the data already on screen was fine. Suggest: show the error screen only when there is no data at all, and a small "couldn't refresh" toast otherwise
- [ ] Events are sorted by their deadline, not their start time: the default sort "Deadline (soonest)" (and "Request Lulyssia help") orders events by the optional deadline field. An event tomorrow with no deadline is listed after one next month that has one. Suggest: on the Events page, sort by start time (and call the option "Soonest first")
- [ ] New items land in second place in "User sort": new, copied and restored items get order number 0, the same as the item at the top, and the tie goes to the older one. So a new item appears second, not first or last. Suggest: give new items the number before the first item (or after the last)
- [ ] Home "Today's Tasks" shows a task twice when it both starts and is due today (one "Deadline" card and one "Starting" card), while the count above says 1. Each list also stops at 3 items with no "+N more". Suggest: one card per task with both times, and a "+N more" link to the Tasks page
- [x] LINE messages clean the text formatting a little differently from the editor: they also remove `==` (not a format the editor has, so "x==1" arrives as "x1"), and a strikethrough that spans two lines keeps its `~~` marks. Suggest: let the LINE functions use the same rules as `src/lib/inlineFormat.ts`

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
7. [x] Not needed (checked on a laptop and a phone: the rows stay readable over her art). Readability: Lulyssia's art sits in front of the drawer items (her layer is above them on purpose), so on short screens keep the items clear of her art instead of adding a backing behind them
