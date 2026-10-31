# 2. Checklists in descriptions, with a progress bar above the name

**Status:** Built
**Branch:** `plan/in-progress-and-checklist/2-checklist` (based on `main`)

## Done when
- [x] "☑ Check" with a caret, with 3 lines selected, and again on the same lines (removed) saves `[ ] ` lines exactly as the rules say, each press one undo step — browser check (local dev server, test data, nothing reaches the live project): 3 selected lines → `[ ] Tent / [ ] Torch / [ ] Food`; pressed again → boxes gone; again → back; one Ctrl+Z undid one press, Ctrl+Y redid it; with the caret in line 1 → `[ ] What to bring:`; with no caret placed → `[ ] `
- [x] Enter after a checklist line starts a new `[ ] ` line with the same indent; Enter on an empty one ends the list — browser check: Enter after "Food" → `[ ] ` (typed "Rain jacket"); Enter on the empty one → a plain line; on an indented line (`      [ ] Tent`) → `      [ ] ` ("Stakes")
- [x] clicking a box in the description box and on a Tasks, Events and Interests card ticks it and saves `[x] `; a refused save puts the box back with the message — browser check: a click in the box → `[x] Torch` (one undo step); on the cards, the save sent only the description with `[x]` on that line (Tasks, Events, Interests, and on Home's Today's Tasks, Main Focus and the details window); a refused save showed "Failed to update task. Please try again." and the bar stayed at 3 / 5; offline, nothing was sent and "Couldn't save. Check your connection and try again." showed
- [x] the bar shows "2 / 5 done" for a description with 5 checklist lines, 2 ticked, on the cards, Home's lists, Main Focus, the details window and Home's In progress cards; green at 5 / 5; no bar without checklist lines — browser check: Home showed 2/5 (Today's Tasks), 1/2 (In progress), 1/2 (Today's Events), 0/2 (Main Focus); the Tasks card 3/5 after a tick; green at 5/5; a task with a plain description has no bar
- [x] ticking a task's last box shows the "mark done?" message, and its button marks the task done — browser check: "All ticked: mark "Camping" done?" with "Mark done"; pressing it saved the task as done (the same code as the card's Done button)
- [x] a long wrapped checklist line continues under its text, on cards and in the box — browser check at 375px: each wrapped checklist line's second row starts where its text starts (22 px, and 46–49 px for an indented one), on the card and in the box
- [x] `formatDetail` turns `[ ] Torch` into `☐ Torch` and `[x] Tent` into `☑ Tent` (script), and nothing else in LINE's text changes; `deno check` passes for the three functions (if Deno is there) — script (esbuild + Node): `[x] Tent` → `☑ Tent`, `[ ] Torch` → `☐ Torch`, an indented `[X] Map` keeps its spaces, a bold item loses only its marks, and `[ ]` in the middle of a line, `[x]` without a space and `- [ ] …` are left alone. Deno isn't available here (tsc --strict on a copy of the file passes instead)
- [x] typecheck, lint and build pass — `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint` on the changed files, `npm run build`

Also checked: the description editor's earlier scripts (typing, Enter, Tab, Shift+Tab, Space, bold, bullets, paste, undo/redo, the Tab button, Ctrl+M, Backspace/Delete, composing a word) give the same text as before this item.

## Owner checks by eye
A checklist in a task, an event and an interest on a computer and a phone: the "☑ Check" button, ticking in the box and on the cards, the bar going green, the "mark done?" message; after deploying, a LINE message with a checklist.

## Assumptions
- The toolbar now also has a "move back out" Tab button (added on `main` before this plan), so "Check" sits after both Tab buttons. Its icon is lucide `ListChecks` with the word "Check".
- In the description box a box stands for its "[ ] " including the space after it, so the caret after a box is always at the start of its text (it could otherwise land between the box and its space, and typing there turned the line back into plain text). Home goes to the line's very start, before the box, as before a bullet.
- A tick from a card is saved quietly (no "Task updated" message each time). A refused save shows the cards' usual message, "Failed to update task. Please try again." (the plan said "Couldn't save"; that wording belongs to the forms). The box doesn't move until the save is back, so a refused one simply stays as it was.
- Home's Upcoming lists show no descriptions, so they get no bar (the plan lists Today lists, Main Focus, the details window and In progress).
- The details window reads the item's current description, so a tick there shows at once.
- Copying a description's text from a card copies the boxes as nothing (they're drawn, not text); the stored text keeps `[ ] ` / `[x] `.
- A ticked line is drawn muted and crossed out in the box too; that's only how it's drawn, not saved as ~~strike~~.

## Needs
Function deploy: `send-line-daily`, `send-line-reminders`, `send-line-overdue` (they share `_shared/lineText.ts`).

## Notes
- A task's Done toggle moved from TasksPage.tsx into `src/lib/taskDone.ts` unchanged, so the "Mark done" button does exactly what the card's Done button does.
- The plan itself is on branch `plan-draft/in-progress-and-checklist` (not on `main` yet).
