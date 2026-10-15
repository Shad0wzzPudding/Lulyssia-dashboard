# Plans

Big changes go through three steps:

1. **Plan** (with the owner, using previews). Copy `TEMPLATE.md` to `docs/plans/<plan-name>/plan.md`
   and fill it in together. Save each preview's HTML in `docs/plans/<plan-name>/previews/`, because a
   cloud session may not be able to open claude.ai links. When every item is decided, set the status
   to `Ready to build` and merge the plan into `main`.
2. **Build** (alone, usually a cloud session): run `/cloud-build <plan-name>`. Each item gets its own
   branch, so a wrong one can be dropped without touching the others. The build writes its notes,
   guesses and checks into `docs/plans/<plan-name>/log/` and finishes with a summary listing the
   branches, the order to merge them and everything to deploy.
3. **Review** (with the owner): run `/cloud-review` on the merged work, then the owner checks the
   "by eye" items (looks, motion, sound) and decides on any guesses and proposals, one at a time.

One folder per plan:

```
docs/plans/<plan-name>/
  plan.md        the plan (from TEMPLATE.md)
  previews/      preview pages saved from the planning session
  log/           written by the build: one file per item, plus summary.md
```
