# Plan: Canonicalize post dates to explicit Asia/Shanghai offset

## Goal
Eliminate timezone ambiguity in post `date`/`updated` frontmatter. Every value
becomes a full ISO-8601 datetime with an explicit `+08:00` offset, so parsing is
deterministic regardless of quoting, of YAML 1.1's implicit-UTC rule, or of the
build machine's timezone (Cloudflare Pages builds in UTC).

## Scope
Included:
- Rewrite `date:` and `updated:` lines in every post under `src/content/blog/`.
- Keep the display formatter locked to `timeZone: 'Asia/Shanghai'` (already done
  in `index.astro` and `blog/[slug].astro`).

Out of scope:
- No custom Zod parser. `z.coerce.date()` stays — once values carry `+08:00`,
  js-yaml resolves them to the correct absolute instant on its own.
- No RSS/schema signature changes.

## Standard format
- Date-only historical posts -> `T00:00:00+08:00` (display shows only the day).
- Posts with a real publish time -> keep the time, append `+08:00`.
  - `thinking-without-limit`: `2026-06-30T22:00:00+08:00`
  - `what-llm-are-you`:       `2026-06-30T23:00:00+08:00`

## Steps
1. Migration script (scratchpad, Node): for each post, within the frontmatter
   block only, rewrite `date`/`updated` values:
   - `^\d{4}-\d{2}-\d{2}$` -> append `T00:00:00+08:00`
   - `...THH:mm(:ss)?` with no offset -> pad seconds if needed, append `+08:00`
   - already has offset/`Z` -> leave untouched.
2. Run script, verify with `rg` that every date/updated line ends in `+08:00`.
3. `npm run build` sanity + `npm run check` (typography/type gate).

## Risks & Open Questions
- Date-only posts shift from UTC-midnight to Beijing-midnight (8h earlier in
  absolute terms). Display is day-only and locked to +08:00, so the rendered day
  is unchanged. RSS `pubDate` instants shift by 8h — acceptable/expected.
- Regression prevention (a linter rule rejecting bare datetimes) is deferred;
  convention + this plan cover it for now.

## Estimated Complexity
Low — mechanical one-time rewrite, no logic changes.

## Outcome
Migrated all 16 posts (30 `date`/`updated` lines) via a one-off Node script;
every value now ends in `+08:00`. Date-only posts got `T00:00:00+08:00`; the two
timed posts kept `22:00`/`23:00`. Display formatters remain locked to
`Asia/Shanghai`. `npm run check` (17/17) and `npm run build` (17 pages) both
pass. Net behavior fix: `thinking-without-limit`/`what-llm-are-you` now render on
2026-06-30 (author's intended Beijing time) instead of drifting to 07-01 UTC.
No custom Zod parser was needed. Regression guard (linting bare datetimes)
deferred.
