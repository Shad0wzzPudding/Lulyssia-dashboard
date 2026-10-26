---
name: cloud-review
description: Unattended code review and bug hunt for the Lulyssia dashboard. First reviews every commit waiting in REVIEW.md, then hunts for bugs area by area across the whole site until the tokens run out or three honest rounds in a row find nothing. Fixes safe bugs on its own branch and writes up anything that changes behaviour as a "Needs decision" proposal. Meant for a cloud session working while the owner is away; run it with /cloud-review.
disable-model-invocation: true
argument-hint: "[optional: 'review only' to stop after the REVIEW.md list, or an area to hunt first]"
---

# Cloud review and bug hunt

You're working alone on this repo while the owner is away and can't answer questions. They'll come back
later, read what you did, and go through your proposals one at a time with Claude. Everything here is set
up so that your work is safe to merge, easy to check, and honest about what was and wasn't covered.

The app: Vite + React + TypeScript + Tailwind + shadcn, TanStack Query, and Supabase (row level security,
SQL migrations, Deno edge functions, pg_cron) with a LINE bot. Days and dates use Thai time
(Asia/Bangkok) throughout; keep it that way.

If the user passed arguments, follow them: "review only" means do Phase 1 and the wrap-up, then stop. An
area name means start Phase 2 with that area.

## Ground rules

These protect the live app and the owner's control over it, so treat them as hard limits.

- **One branch.** Start from the latest `main`, create `cloud-review-<YYYY-MM-DD>` (today's date), and do
  all work there. Never commit to `main`, merge, open or merge a pull request, or force-push. The owner
  merges after checking.
- **Push often.** Push after every commit or every few. A cloud session can stop at any moment when the
  tokens run out, and unpushed work is lost.
- **Keep the history about the code.** The roadmap line for a fix goes in the fix's own commit. Notes
  that aren't part of a fix (proposals, the rounds log) go in one `Docs :` commit every few rounds, and
  REVIEW.md is updated only when Phase 1 ends and when you stop. A history where half the commits only
  update notes is hard for the owner to read and review (one run had 21 notes-only commits beside 24
  fixes).
- **Nothing outward-facing.** Don't deploy, apply migrations to the live database, write to the live
  project, or read, print or ask for secrets (that includes the cron secret `line_cron_secret` /
  `LINE_CRON_SECRET`). You may write new migration files and change edge functions; the owner applies
  and deploys them.
- **No new dependencies** in package.json. Test-only tools, such as `@electric-sql/pglite` for running
  migrations in an in-memory Postgres, go in a scratch folder outside the repo.
- **Every commit passes** `npx tsc --noEmit -p tsconfig.app.json` and `npx eslint` on the files you
  changed. For edge functions, run `deno check --node-modules-dir=none <file>` when Deno is available
  (delete any deno.lock it creates); if it isn't available, say so in the commit body.
- **Commit style** (match the history): one commit per fix. The subject reads `Fix : <what the user
  notices now>`, with a space before the colon (`Perf :`, `Chore :`, `Docs :`, `Feat :` also exist). Then a
  blank line and "- " bullets saying what was wrong and what changed. Add "(needs migration <file>)" or
  "(needs function deploy: <names>)" to the subject when that's true, so the owner knows to apply it
  before merging.
- **Plain words.** The owner reads every finding. For each one, say what a person would see go wrong,
  give a concrete example, and describe the fix. Avoid jargon where a plain phrase works.

## Fix it, or propose it

The owner wants safe bugs fixed for them, but wants to decide anything that changes how a feature works.
For each confirmed bug:

- **Fix it** when the fix keeps the feature working the way it was clearly meant to: a crash, wrong data
  or counts, a lost save, a security hole, a broken layout. Commit the fix.
- **Propose only** when the fix would change how a feature behaves or looks, remove or limit something,
  need a product choice (wording, limits, defaults, which of two behaviours is right), or touch the LINE
  bot's message flow or its monthly message allowance. Leave the code alone and write the bug plus one or
  two fix options, with your recommendation, into roadmap.md marked `Needs decision`.

When unsure, propose. A wrong proposal costs a minute of the owner's time; a wrong "fix" changes their app
without asking.

## Where things are recorded

- **roadmap.md:** add `## Cloud review (<date>)` near the other "Cloud bug hunt" sections. One line per
  finding:
  - fixed: `- [x] <High|Medium|Low>: <plain explanation>. Done: <what changed> (<commit>)`. Tick it in the
    same commit as the fix.
  - proposed: `- [ ] <High|Medium|Low>: <plain explanation>. Needs decision: <options, recommendation>.
    Size: <small|medium|large><, needs a preview>`. The size (small: under an hour, medium: a few
    hours, large: more) and whether the choice is easier to make by looking at a preview let the owner
    plan the decisions and the building.
- **docs/reviews/<date>-cloud-review.md:** the rounds log (format in Phase 2). It's long and only
  matters for checking the run, so it stays out of roadmap.md; the roadmap section links to it.
- **REVIEW.md:** follow the plan in the comment at its top, with one exception. That plan says to ask
  before reviewing a large waiting list, but nobody can answer, so review all of it.

## Phase 1: review the waiting list

1. Read REVIEW.md. Everything on `main` after "Last reviewed" is unreviewed:
   `git log --oneline <last reviewed>..HEAD`. If the list is empty, go straight to Phase 2.
2. Review every commit: read its diff together with the code around it. Look for bugs, edge cases,
   security problems (row level security gaps, functions anyone can call without a check), performance
   problems and clean-ups worth doing.
3. Fix or propose each finding as above.
4. Then update REVIEW.md in a `Docs :` commit (together with any proposals from this phase):
   - set "Last reviewed" to the newest commit you reviewed;
   - clear the waiting list;
   - add a "Review history" line (date, range, number of commits, result);
   - put the commits you made during the review back in the waiting list, newest first. Nobody has
     reviewed your own fixes yet.

## Phase 2: bug hunt rounds across the whole site

Run rounds until you run out of tokens, or until three rounds in a row find no new confirmed bug (see
"Counting" below: that stop only counts once every area has been covered recently).

**Before the first round: what earlier runs covered.** Every run leaves a rounds log in docs/reviews/.
Read them all and note, for each area in the list below, when it was last covered. Treat an area as not
covered if its files changed since then (`git log --since=<that run's date> -- <its files>`). Then go
through the areas in this order: never covered first, then changed since covered, then the longest
ago. Otherwise every run would start from the top of the list, recheck the same recently clean pages,
stop after three empty rounds and never reach the areas lower down. Write the order you chose at the
top of this run's rounds log.

**A round:**

1. Take the next area in that order, and name it. The areas:
   1. Home page
   2. Tasks page (including daily and repeating tasks)
   3. Events page
   4. Interests page
   5. Settings page (name, LINE card, tags, animating menu, sound)
   6. Navigation, drawer and page transitions
   7. Select mode, search, sort and filters
   8. Recent Changes and undo
   9. Attachments and storage clean-up
   10. The editor's text formatting
   11. The data hooks and caching (src/hooks)
   12. Each LINE edge function: webhook, daily, reminders, overdue, bot info, rich menu
   13. Migrations, row level security and cron jobs
   14. Phone layouts (360-430px) and accessibility
   15. Time zones and dates

   Once all are covered, do a second pass by angle instead of by area: each angle cuts across every
   page, and these found real bugs before:
   - long unbroken words (web addresses, emails, one-word names) on 320-430px phones;
   - double clicks and double Enter on every button and form;
   - keyboard only (Tab, Enter, Space, Esc) and screen reader names;
   - the installed app: no address bar or reload, iPhone status bar and home bar, offline start;
   - failed and slow saves: what happens to what was typed, and to the screen;
   - many items (hundreds of tasks): speed and layout;
   - access rules: what a signed-in user could do through the database API that the app never does.
   Then go back to the areas with the most code, with fresh eyes.
2. Read every file in the area in full, plus the code it calls.
3. Check it concretely:
   - typecheck, lint and `npm run build`;
   - trace each user action through the code;
   - try edge cases: empty lists, one item, many items, midnight in Thai time, month ends, failed or
     slow requests, double clicks, two open tabs;
   - run migrations in PGlite when database logic is involved;
   - write small throwaway scripts in the scratch folder to test pure functions.
4. Count only bugs you can show: a failing script or query, or an exact code path with the input that
   triggers it. Style preferences and "might be nicer" ideas aren't bugs. Leave them out.
5. Fix or propose each bug, commit, push.
6. Log the round in docs/reviews/<date>-cloud-review.md:
   `- Round N (<area>): read <files>; checked <what you did, briefly>; found <X fixed, Y proposed>`, or
   `found no new bug`.

**Counting "no new bug" rounds honestly.** The three-in-a-row stop exists to end the hunt when the code
is genuinely clean, not to give an easy way out. So:

- A round counts toward the three only if its log lists the files read and the checks run, and its area
  wasn't covered before in this run.
- The stop only applies once every area in the list has been covered in this run or in one of the two
  runs before it (with no changes since). Until then, keep going through the areas not covered yet,
  even after three clean rounds: an area nobody has looked at recently is where bugs are most likely.
- Don't pick small or easy areas to finish sooner, and don't lower the bar as rounds go on.
- Re-checking fixes you just made isn't a round.
- Any round that finds a bug resets the count to zero.

## Before you stop

Whether you finish or run low on tokens, keep enough budget for this:

1. Everything is committed and pushed, including the last notes commit.
2. A short summary sits at the top of the roadmap section, with a link to the rounds log:
   - rounds run, bugs fixed, proposals waiting (with their sizes added up);
   - migrations to apply and functions to deploy, by file and function name;
   - why you stopped: three clean rounds, or out of tokens, and which area you were on;
   - which areas this run covered, and which ones the next run should start with.
3. REVIEW.md lists all your own commits in its waiting list, newest first.
