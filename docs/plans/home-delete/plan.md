# Plan: home-delete

**Status:** Reviewed <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `a235a5e` (2026-11-04)
**Decided with the owner on:** 2026-11-04

## Goal

Tasks and events can be deleted straight from Home's calendar. Next to the date panel's plus there is
now a minus ("+ / −"). Pressing it puts a red delete button on each item for that date. Deleting
from there always asks first, unless the person ticked "Don't ask again today" on this device.

## Not in this plan

- The delete buttons on the Tasks and Events pages, and their select mode. They stay exactly as they
  are, deleting without a question. The question is only for deletes from Home's calendar.
- Deleting interests, daily tasks or Recent Changes entries from Home.
- Remembering "don't ask" for the whole account or across devices. The owner chose this device only.
- Any other part of Home: Today Events, Upcoming Events, In Progress and the calendar itself.

## Items

Build them in this order. Each one is its own branch and can be merged on its own unless it says
"Depends on".

### 1. "+ / −" and delete mode in the date panel, asking before each delete

- **Branch:** `plan/home-delete/1-delete-mode`
- **What it does:**
  - In the date panel's header (right of the picked date), the plus becomes `+ / −`: the plus as
    now, a grey slash, then a minus.
  - Pressing the minus turns delete mode on. The minus turns red, a short red line under the header
    explains what to do, and each task and event in the panel's list gets a red delete button
    (trash icon) at its bottom right.
  - Pressing an item's delete button opens Lulyssia's confirm window. Confirming deletes the item
    exactly as the Tasks or Events page does. "Nevermind~", Escape or a click outside the window
    leaves the item alone.
- **Rules decided:**
  - Look: option A, plain icons. `+ / −` uses the same ghost icon buttons as today's plus, with a
    grey `/` between them that isn't a button. It isn't a switch: the two buttons sit side by side.
  - The minus is a toggle (`aria-pressed`). Off, it is cyan like the plus. On, it is red
    (red-500/red-400, with a faint red background like the preview's). Accessible name: "Delete
    mode: show a delete button on each item"; title: "Delete items on this date".
  - The hint line while delete mode is on: "Delete mode: pick the item to delete. Press − again when
    done." It is small and red, under the header.
  - Delete mode ends when the minus is pressed again, another date is picked, or the person leaves
    Home (owner's choice). It also ends when the last item on the date is deleted and the panel
    shows "Free Day". The minus is disabled on a Free Day, since there is nothing to delete.
  - While delete mode is on, clicking an item card still opens its details window, as now. Only the
    red button deletes. The button stops the click from reaching the card.
  - Each delete button is named "Delete task: <title>" or "Delete event: <title>", with the title
    "Delete". It has the destructive look (red border, faint red background) and a 30-32px tap
    area. It sits at the bottom right of the item, on the same row as the time chips, and pushes
    nothing else around. Leave the item's existing pencil (EditButton) as it is.
  - The window is the existing `LulyssiaConfirmDialog`, with its random line and sticker, and its
    open, confirm and cancel sounds as usual. Wording (owner's choice: "like the other deletes"):
    - title: `Delete this task?` / `Delete this event?`;
    - description: `"<title>" will be deleted. You can undo it from Recent Changes on Home.`;
    - confirm button: `Yes, delete it!`; cancel button: the default `Nevermind~`.
  - Deleting: Home gets `onDeleteTask` and `onDeleteEvent` props from Index, the same
    `mutations.deleteTask.mutate` / `mutations.deleteEvent.mutate` the pages use. It plays
    `playDeleteSound()` as the pages do, at the moment the delete is sent. The mutation's own
    toast ("Task deleted successfully!") and Recent Changes entry come with it, so it can be undone.
  - One delete per item: a double click on the delete button or the confirm button sends one
    delete. The dialog already guards its confirm button; guard the delete button too, e.g. ignore
    an item whose delete is already on its way.
  - A repeating task is deleted the same way the Tasks page deletes it (the whole task). No extra
    question.
- **Preview:** `previews/delete-mode.html`, published at
  https://claude.ai/artifact/JfCdyusmX4K8xzzdZJdagw. Intent only: use the app's real Button, icons
  (lucide `Plus`, `Minus`, `Trash2`) and `LulyssiaConfirmDialog`, not the preview's drawn copies.
- **Done when:**
  - [ ] the header shows `+ / −`, and the plus works as before (menu, New task / New event);
  - [ ] the minus toggles delete mode: `aria-pressed` and red when on; the hint shows; each item has
        a named delete button at its bottom right; nothing in the list shifts when it turns on,
        beyond the button's row;
  - [ ] delete mode turns off on the minus, on picking another date, and after the last item is
        deleted; the minus is disabled on a Free Day; coming back to Home starts with it off;
  - [ ] clicking an item card in delete mode opens its details; clicking its delete button doesn't;
  - [ ] on Test-dummy, a "ZZ …" task and a "ZZ …" event deleted from the panel: the window asks
        with the wording above; Nevermind~ and Escape keep the item; confirming deletes it (gone
        from the panel and its page, toast shown, a Recent Changes entry that undoes it); clean up
        afterwards (undo or delete, then remove the test Recent Changes entries);
  - [ ] a double click on a delete button and on "Yes, delete it!" sends one delete (one request,
        one Recent Changes entry);
  - [ ] the Tasks and Events pages' delete buttons still delete without a window;
  - [ ] keyboard: Tab reaches the minus and each delete button, Enter/Space work, and focus goes
        back sensibly after the window closes; the item isn't announced twice;
  - [ ] at 360-430px wide: the header and items fit, no sideways scroll;
  - [ ] typecheck, lint and build pass.
- **Owner checks by eye:** the `+ / −` and the red minus; the delete buttons on the items (on a phone
  too); the window and its sounds; the delete sound.
- **Needs:** nothing.
- **Depends on:** nothing.

### 2. "Don't ask again today" in the delete window

- **Branch:** `plan/home-delete/2-dont-ask-today`
- **What it does:** the delete window from item 1 gets a tick box, "Don't ask again today". If it's
  ticked when the person confirms, later deletes from Home's calendar happen straight away, without
  the window, on this device until midnight Thai time. The next day the window asks again.
- **Rules decided:**
  - Remembered on this device only (owner's choice): `localStorage` key `homeDeleteNoAskDate`,
    holding the Thai date it was ticked, `YYYY-MM-DD`. Work out that date the way LineSettings'
    `thaiToday` does: `new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })`.
    Move that helper to `src/lib` if you use it from two places. Skip asking only while the stored
    date equals today's Thai date. Wrap every read and write in try/catch: if storage fails, the
    window simply asks.
  - The tick only counts when the person confirms. Ticking it and then pressing Nevermind~ saves
    nothing.
  - The box starts unticked each time the window opens.
  - Without the window, a delete still plays the delete sound and shows the mutation's toast. Nothing
    else changes: the Recent Changes entry, undo and the one-delete-per-item guard stay the same.
  - The box belongs only to this window. Add it to `LulyssiaConfirmDialog` as an optional prop (for
    example `dontAskLabel` plus a way to read whether it was ticked on confirm). Every other use of
    the dialog (Tasks, Events, Interests, Settings, the drawer, tags) must look and work exactly as
    before. Use the app's `Checkbox` with a label the person can click, between the description and
    the buttons, centred like the preview.
- **Preview:** `previews/delete-mode.html` (the window), published as above. Intent only.
- **Done when:**
  - [ ] the window shows the unticked box, and it can be ticked with a click, a tap or the keyboard
        (Space);
  - [ ] ticked + confirm: the next delete on Home's calendar that day goes straight through, with
        the delete sound and toast; ticked + Nevermind~: the next delete asks again;
  - [ ] with the stored date set to yesterday (set the key by hand), the window asks again; a broken
        or missing key asks;
  - [ ] the other confirm windows (e.g. Tasks' "Clear completed", select mode's delete) have no box
        and work as before;
  - [ ] on Test-dummy with "ZZ …" items, cleaned up afterwards; typecheck, lint and build pass.
- **Owner checks by eye:** the box in the window (look and place, on a phone too).
- **Needs:** nothing.
- **Depends on:** item 1 (build on item 1's branch).

## Questions answered while planning

- **Q:** How does "+ / −" look? **A:** Option A: plain ghost icons like today's plus, with a grey
  slash between them. The minus turns red while delete mode is on. It isn't a switch: two buttons
  side by side.
- **Q:** When does delete mode turn itself off? **A:** When the minus is pressed again, another
  date is picked, or the person leaves Home. While it's on, several items on the same date can be
  deleted one after another.
- **Q:** Where is "Don't ask again today" remembered? **A:** On this device only, until midnight
  Thai time.
- **Q:** What does the window say? **A:** Like the other delete windows: "Delete this task?" (or
  event), then `"<title>" will be deleted. You can undo it from Recent Changes on Home.`, then
  "Nevermind~" / "Yes, delete it!". Lulyssia's random line and sticker stay on top.
- **Q:** Do the other pages' deletes get a question too? **A:** No. The owner was explicit: only
  this way of deleting asks, and the Tasks and Events pages' deletes stay as they are.
- **Set while planning, not asked** (change them at the review if wanted): the minus is disabled
  on a Free Day; delete mode ends after the last item on the date is deleted; clicking an item card
  in delete mode still opens its details; the tick only counts on confirm.

## Decided after the build (review with the owner, 5 Nov 2026)

- Owner checks by eye: the `+ / −` and the red minus, the delete buttons (on a phone too), the
  window and its sounds, the delete sound, and the "Don't ask again today" box: all fine as built.
- The build's guesses: the 32px delete button (its row grows 12px) and the centred, muted box were
  settled by the checks above. Focus going back to the "−" (or the plus on a Free Day) after a
  delete: keep.
- A delete still on its way ignores more presses on that item: keep, and Lulyssia now says so. A
  press more than 0.6s after the first (not a double click) brings her out under the date panel's
  header with her pouting sticker, like the "Collapse all" pout: "Hold on! The last item is still
  being saved, please wait~".
- After a delete without the window ("Don't ask again today" ticked), focus goes to the "−" once
  the item has left, the same as after a confirmed delete: keep.

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

Nothing to deploy or migrate. Both items are front-end only and go out with Vercel when merged.
Merge order: item 2 (it brings item 1), then the summary branch. Item 1 can go alone.

- [x] Nothing to apply or deploy (checked at build, 4 Nov 2026).

## Summary

`summary.html`: the whole build at a glance (now → after), published at https://claude.ai/artifact/Q4dT5zA2TRvgFgeRhM4pXd
