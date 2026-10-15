---
name: cloud-build
description: Builds a finished plan from docs/plans/ while the owner is away. Each plan item becomes its own branch, checked against the plan's "Done when" list, with every guess written down for the owner to see later. Meant for a cloud session; run it with /cloud-build <plan-name>, then review the result with /cloud-review.
disable-model-invocation: true
argument-hint: "<plan-name> (a folder in docs/plans/; leave empty to pick the plan marked 'Ready to build')"
---

# Build a plan

You're building a plan the owner and Claude worked out together, while the owner is away and can't
answer questions. They decided the plan carefully, often by looking at previews, so the job is to build
what the plan says: not more, not something you think is better. When the plan doesn't cover something,
you make the smallest reasonable choice and write it down where the owner will see it.

The app: Vite + React + TypeScript + Tailwind + shadcn, TanStack Query, and Supabase (row level security,
SQL migrations, Deno edge functions, pg_cron) with a LINE bot. Days and dates use Thai time
(Asia/Bangkok) throughout; keep it that way. docs/plans/README.md explains the plan → build → review
cycle this skill belongs to.

## Which plan

Use the plan named in the arguments: `docs/plans/<plan-name>/plan.md`. With no argument, take the plan
whose status is `Ready to build`. If there's none, or more than one, stop and say so in your final
message rather than guessing which to build.

## Ground rules

These protect the live app and the owner's control over it, so treat them as hard limits.

- **Never on `main`.** Work only on the branches described below. Never commit to `main`, merge, open or
  merge a pull request, or force-push. The owner merges after checking.
- **Push often.** Push after every commit or every few. A cloud session can stop at any moment when the
  tokens run out, and unpushed work is lost.
- **Nothing outward-facing.** Don't deploy, apply migrations to the live database, write to the live
  project, or read, print or ask for secrets (that includes the cron secret `line_cron_secret` /
  `LINE_CRON_SECRET`). You may write migration files and change edge functions; the owner applies and
  deploys them.
- **No new dependencies** in package.json unless the plan names them. Test-only tools (for example
  `@electric-sql/pglite` to run migrations in an in-memory Postgres) go in a scratch folder outside the
  repo.
- **Every commit passes** `npx tsc --noEmit -p tsconfig.app.json` and `npx eslint` on the files you
  changed. For edge functions, run `deno check --node-modules-dir=none <file>` when Deno is available
  (delete any deno.lock it creates); otherwise say so in the commit body.
- **Commit style** (match the history): subject `Feat : <what the user gets>` (or `Fix :`, `Chore :`,
  `Docs :`), with a space before the colon, then a blank line and "- " bullets saying what changed. Add
  "(needs migration <file>)" or "(needs function deploy: <names>)" to the subject when that's true.
- **Plain words** in everything the owner reads: what a person sees and does, not internals.

## Before building: check the plan is still current

The plan records the `main` commit it was written against. Compare it with today's `main`
(`git log --oneline <that commit>..origin/main` and the diff of the files the plan touches).

- If those files haven't changed, go ahead.
- If they changed in a way the plan simply needs to follow (a renamed component, a moved file), adapt and
  note it in the item's log.
- If a change makes an item mean something different, or makes it unnecessary, don't build that item.
  Mark it Blocked in its log and say why.

## Building each item

Go through the items in the plan's order.

1. **Branch.** Name it as the plan says (`plan/<plan-name>/<n>-<short-name>`). Start from `main`, or from
   the branch of the item it depends on when it says "Depends on". The log notes the base, because
   dependent branches have to be merged in order.
2. **Build what the item describes,** following its "Rules decided" and the plan's "Questions answered".
   Reuse the app's existing components and styles, so new parts look like the rest of the app.
   - A preview marked **Exact**: match it closely.
   - A preview marked **Intent only**: it shows the idea, not the sizes or spacing; build it with the
     app's real components. (A preview once showed simplified, smaller cards; copying that would have
     shrunk the real ones.)
3. **When the plan doesn't cover something,** build the smallest version that fits the plan, write the
   choice under "Assumptions" in the item's log, and carry on. If the gap is big enough that a guess
   could change what the item is, stop that item, mark it Blocked with the question, and move to the
   next one. Don't add features, settings or polish the plan doesn't ask for.
4. **Check every "Done when" line** and record how you checked it (the command, script or code path).
   Use typecheck, lint, `npm run build`, small scripts in the scratch folder, and PGlite for database
   logic. Be honest: a line you couldn't verify is "not verified", with the reason.
5. **Write the item's log** at `docs/plans/<plan-name>/log/<n>-<short-name>.md`, on the item's own
   branch (one file per item, so branches never clash):

   ```markdown
   # <n>. <Item name>

   **Status:** Built | Partly built | Blocked
   **Branch:** `plan/<plan-name>/<n>-<short-name>` (based on `main` | on item <m>'s branch)

   ## Done when
   - [x] <line from the plan> — <how it was checked>
   - [ ] <line> — not verified: <why>

   ## Owner checks by eye
   <copied from the plan, plus anything else that looks, moves or sounds different>

   ## Assumptions
   <each choice the plan didn't cover, and why; "none" if none>

   ## Needs
   <migration files and functions to deploy, by name; "nothing">

   ## Notes
   <adaptations to code that changed since the plan, anything else worth knowing>
   ```

6. **Commit and push** the item: one or a few commits, each passing the checks. Then go on to the next
   item.

## Finishing

When every item is built or blocked, or you're running low on tokens (keep enough budget for this
step), create `plan/<plan-name>/summary` from `main` with:

- `docs/plans/<plan-name>/log/summary.md`:
  - each item with its status and branch;
  - the order to merge the branches (dependent branches after the ones they build on, this summary
    branch last);
  - the full deploy checklist in order: which migration or function, and after merging which branch;
  - every Assumption and Blocked question in one list, so the owner can go through them one at a time;
  - the "Owner checks by eye" list for all items;
  - if you stopped early: which item you were on and what's left.
- In `plan.md`: set the status to `Built` (or keep `Building` if items are left) and complete its
  deploy checklist.

Commit, push, and end your final message with the summary's main points and a reminder that the next
step is `/cloud-review` once the branches are merged.
