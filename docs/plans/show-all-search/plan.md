# Plan: show-all-search

**Status:** Built <!-- Draft → Ready to build → Building → Built → Reviewed -->
**Written against:** `main` at `72275fe` (2026-11-05), on branch `show-all-fixed-size`
**Decided with the owner on:** 2026-11-05

Small, so built in the planning session (owner's choice), not by /cloud-build. This file records
what was decided.

## Goal

The "Show all" window (behind every "+N more" cover) gets a fixed size, a small search beside its
title, and, when that search has options, the same green and red chips as the page's search bar, on
a Persona-style panel behind the cards.

## Items

### 1. Fixed size (`259821c`)

- Not resizable. Up to 64rem wide (95% of the screen at most), 90% of the screen tall; full width on
  a phone. Inside, the columns follow the window's width (cards at least 18rem).

### 2. A small search beside the title (`2ed0bae`)

- Right of "All … (N)", under it on a phone. Reads a search like the page's (title and description,
  commas, "!"). Starts empty each time; the window keeps its opening height while searching; on a
  touch screen the window doesn't focus the search when it opens.

### 3. The search's chips on a panel

- **Rules decided:**
  - Look A (owner's choice), with the tab at the top-right instead of the top-left: a black slab
    with a white edge and a cyan offset slab, slanted (a fixed 12px, so a long list doesn't lean off
    its cards); a slanted cyan tab with "SHOWING" and the chips (on black).
  - Shown only when the search has options (a comma or "!"), like the page's chips (owner's choice).
    A plain search just filters.
  - Animation: Slam (owner's choice). The slabs swing in slanted from the left and land with a small
    bounce, the tab drops onto the corner, the cards rise in one by one. It plays when the panel
    appears, not on every key; none for people who ask for reduced motion.
  - The chips are the page's own (`SearchChips`), so screen readers hear the same description.
- **Preview:** `previews/search-panel.html`, published at
  https://claude.ai/artifact/WS6b3awmTGgrtcC3Z3sgKE. Intent only.
- **Owner checks by eye:** the panel and tab (on a phone too), and the Slam animation.

## Questions answered while planning

- **Q:** Which look? **A:** A, with the tab at the top-right.
- **Q:** When does the panel show? **A:** Only when the search has options.
- **Q:** Which animation? **A:** Slam. The owner thinks Deal (cards dealt onto the panel one by one)
  would fit the coming "Tag present" feature.

## Deploy checklist

- [x] Nothing to apply or deploy: front end only.
