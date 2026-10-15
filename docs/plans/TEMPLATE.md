# Plan: <name>

**Status:** Draft <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `<commit>` (<date>)
**Decided with the owner on:** <date>

## Goal

<What this plan gives the person using the app, in two or three plain sentences.>

## Not in this plan

<Things that came up while planning but are left out on purpose, so the build doesn't add them.>

## Items

Build them in this order. Each one is its own branch and can be merged on its own unless it says
"Depends on".

### 1. <Item name>

- **Branch:** `plan/<plan-name>/1-<short-name>`
- **What it does:** <from the user's side: what they see and do>
- **Rules decided:** <the answers we settled on: limits, wording, defaults, what happens when…>
- **Preview:** `previews/<file>.html` — <Exact: build it to match | Intent only: shows the idea, not
  the sizes or spacing; use the app's real components>
- **Done when:**
  - [ ] <a check the build can verify itself: a behaviour, a count, a script, typecheck/lint/build pass>
  - [ ] <…>
- **Owner checks by eye:** <looks, motion, feel, sound: what to look at after merging, or "none">
- **Needs:** <migration file / functions to deploy / "nothing">
- **Depends on:** <item number, or "nothing">

### 2. <Item name>

<same fields>

## Questions answered while planning

<Each question that came up and its answer, so the build doesn't have to guess.>

- **Q:** <question> **A:** <answer>

## If something isn't covered here

Build the smallest version that fits this plan, write the guess in the item's log under
"Assumptions", and carry on. If the gap is big enough that a guess could change what the item is,
skip the item and mark it Blocked in its log with the question for the owner.

## Deploy checklist

Filled in during planning where known, and completed by the build. In the order to apply them, after
merging the matching branch:

1. <e.g. apply migration `supabase/migrations/…sql` (item 2)>
2. <e.g. deploy function `send-line-daily` (item 3)>
