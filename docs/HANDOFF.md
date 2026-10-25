# Handoff: where the work stands (25 Oct 2026)

Written at the end of a Claude Code session on the owner's Windows PC, so a session on another
device can pick up from here. Read this first, then `REVIEW.md` and `docs/plans/review-proposals/plan.md`.

## Open right now: branch `fix/toasts-behind-nav` (not merged)

Three commits on top of `main` (`58308d3`), all tested in the browser, typecheck + lint + build pass:

| Commit | What |
| --- | --- |
| `85ba844` | Pop-up messages sit behind the round menu button (both toasters at z-55: above forms at z-50, under the menu at z-60) |
| `246dbf1` | Messages can be swiped away: Sonner 1.5 → 2.0.8 (swipe right or down), and also while a form is open (`ignoreMessages` in `src/components/ui/dialog.tsx`, `pointerEvents: auto` on the toaster) |
| `86bfd64` | The round menu button slides out (0.3s, to the right) while any Dialog window is open, and back when it starts closing (`src/hooks/useWindowOpen.ts`, the `Dialog` wrapper in `dialog.tsx`, `Navigation.tsx`) |

**Waiting on the owner:** they were about to try both in the app (swipe a message; open and close a
task form and watch the menu button). If they're happy:

1. Add the three commits to the top of the "Waiting for review" table in `REVIEW.md` (newest first,
   one line in the intro naming the branch), commit as `Docs : REVIEW.md waiting list adds …`.
2. Fast-forward `main` to the branch and push (`git merge --ff-only`), then delete the branch
   locally and on GitHub. The owner has asked for this each time so far; still confirm first.

Open choice to mention: the slide plays even when the device asks for reduced motion (the owner's
PC does). The owner asked for the slide; offer to make it instant on such devices if they prefer.

## Done and live on `main` in this session (23–25 Oct 2026)

- Reviewed the cloud build of plan `review-proposals` (11 items), with the owner deciding every
  open question; the plan is marked Reviewed and its "After the build" section lists the decisions.
- Owner-reported bugs fixed: the description editor no longer jumps to the top on bold / italic /
  "• Add" / undo; the tag list in forms scrolls (phone and mouse wheel); a repeating task can be
  finished for good ("Done for good" on the message after ticking it).
- Bulk delete in select mode is one request per 100 items, cards leave at once, failure puts them back.
- Old `plan/review-proposals/*` branches deleted; the git remote now points to
  `https://github.com/Shad0wzzPudding/Lulyssia-dashboard.git` (the repo was renamed from march7th-dashboard).

## Still to do (owner's choice, nothing urgent)

- **After the next Vercel deploy, check on the owner's Android phone:** the installed app's
  long-press → "Add Task" shortcut; its dark launch screen and cyan status bar (may need a
  reinstall); the tag list scrolling by touch; one day, a daily task edit left open past midnight
  (it should move to today's copy keeping the typed text).
- **Code review of the "Waiting for review" list in `REVIEW.md`** (39 commits, more after this
  branch merges). "Last reviewed" is still `36c0c12`.

## How this owner works (keep to it)

- Explain in plain words; ask one decision at a time with options and a recommendation.
- Commit messages: `Fix : …` / `Feat : …` / `Perf : …` / `Docs : …` (space before the colon), a body
  saying what changed from the user's side, ending with the Co-Authored-By line.
- Every push to `main` refreshes `REVIEW.md`'s waiting list in the same push (rule in its header).
- Testing in the browser: only the account named **"Test-dummy"** (header says "Welcome, Test-dummy !")
  is a test account; any other is the owner's real account, so stop and ask. Never type the
  password; the owner signs in. Name test items `ZZ …` and delete them afterwards.
- Dev server: `npx vite --host --port 8080 --strictPort` (port 8080 keeps the browser's sign-in).
  On Windows, stopping a background dev server may leave `node vite.js` running and the next one
  moves to 8081/8082 serving stale code: check the ports and end the old processes. After a
  dependency change, start it with `--force` so it doesn't serve a cached old copy.
