# Plan: Backfill `updated` from git history

## Goal
Add a script that reads each blog post's last-modified time from git history and
writes it into the post's `updated` frontmatter field, so the post page can show
a "更新于" date. One-time backfill now; reusable for future edits.

## Scope
- Included: a Node ESM script `scripts/backfill-updated.mjs` that walks
  `src/content/blog/**/*.md`, reads each file's last git commit date, and sets the
  `updated:` frontmatter field. An npm script `backfill:updated`. A `--dry-run`
  flag.
- Out of scope: changing sort/RSS to use `updated` (still keyed on `date`); the
  schema/display already added in the previous change; non-`.md` content.

## Decisions
- "Update time" = the file's **last git commit date** (`git log -1 --format=%cs`,
  committer date, `YYYY-MM-DD`). Per user choice ("Last commit date for all"),
  written whenever it is strictly later than the post's `date`. Given the repo was
  bulk-imported on 2026-06-22/23, effectively all posts receive an `updated`.
- `updated == date` (single-day case) → field omitted, matching the page logic
  that only shows "更新于" when `updated > date`.
- Frontmatter edited textually (no YAML dep): replace an existing `updated:` line,
  else insert directly after the `date:` line. Everything else preserved verbatim.
- Files with no git history (uncommitted/new) are skipped with a warning.

## Steps
1. Write `scripts/backfill-updated.mjs` (recurse `src/content/blog`, skip
   `_`-prefixed; for each `.md` read last commit date; parse `date:`; compare;
   upsert `updated:`; write unless `--dry-run`).
2. Add `"backfill:updated": "node scripts/backfill-updated.mjs"` to package.json.
3. Run `--dry-run`, review, then run for real.
4. Run `npm run check` (typography linter blanks frontmatter, so new lines are safe).

## Risks & Open Questions
- Git committer date reflects when the repo was set up, not real authoring — accepted
  per user decision.
- Date string edge cases (quoted/with time) handled by slicing the first 10 chars.

## Estimated Complexity
Low — single mechanical script over a flat content directory.

## Outcome
- Added `scripts/backfill-updated.mjs` (ESM, no deps, `--dry-run` supported) and the
  `backfill:updated` npm script.
- Dry-run then real run set `updated` on all 12 posts: 10 → `2026-06-22`,
  2 (`leave-a-h-market.md`, `programmer.md`) → `2026-06-23`. Field inserted directly
  after the `date:` line. 0 skipped.
- `npm run check` passes (10 files, 0 errors; 17 tests pass).
- No deviations from the plan.

## Superseded (2026-07-01)
The auto-stamping subsystem this plan describes — the `.githooks/pre-commit`
hook, `scripts/stamp-updated.mjs`, `scripts/backfill-updated.mjs`, and
`scripts/lib/updated-frontmatter.mjs` — has been removed. `updated` is now
maintained by hand. See docs/plan-date-tz.md for the timezone-explicit date
convention that replaced it.
