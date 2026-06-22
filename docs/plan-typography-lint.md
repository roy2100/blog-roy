# Plan: Extend the typography linter

## Goal
Extend `scripts/check-typography.mjs` (formerly `check-punctuation.mjs`) from a
quotation-mark-only linter into a broader Simplified-Chinese typography linter,
so `npm run check:typography` catches the
common GB/T 15834 typesetting problems beyond quotes. No new dependencies — keep the
project's hand-rolled, zero-runtime-dep philosophy.

## Scope
Included — new deterministic rules (all reuse the existing code-fence / inline-code
stripping so snippets are exempt):
1. Ellipsis: ASCII `...` or `。。。` / standalone `…` adjacent to CJK → must be `……`.
2. Dash: a lone em dash `—` adjacent to CJK (should be the paired `——`); also `--`.
3. Repeated full-width punctuation: `，，` `。。` `！！` `？？` `、、` `；；` `：：`.
4. Half-width sentence punctuation adjacent to CJK: `,` `;` `!` `?` `:` and `.`
   (period only when not part of a number/URL) → use the full-width form.
5. Half-width parentheses/brackets wrapping CJK: `(` `)` `[` `]` adjacent to CJK
   → full-width `（ ）`【 】.
6. CJK ↔ Latin spacing: require a space where a *Latin token* (a run of
   alphanumerics containing at least one letter, so `2018`/`10` stay exempt)
   touches CJK. Catches `Java程序员`, `H5页面`; leaves `2018年`/`10月` alone.

Also: a per-post `lang` frontmatter field (`zh` | `en`, default `zh`) added to
`src/content.config.ts`. The linter reads it and skips Chinese rules for `en`
posts; `Base.astro` maps it to `<html lang>` (was hard-coded `zh-CN`).

Out of scope — autofix (linter only, reports + exits 1), English typography
rules, restructuring the existing quotation logic.

## Steps
1. Add `lang` to the Zod schema; wire `Base.astro` + `blog/[slug].astro`.
2. Add rules 1–6 to `checkFile()`, gated behind `lang !== 'en'`; blank the
   frontmatter block too so YAML (e.g. `tags: [随笔, 程序员]`) isn't flagged.
3. Tune regexes against false positives (period in `3.14`/URLs, time `12:00`,
   dates `2018年`, inline-code already blanked).
4. Run `npm run check:typography`; triage findings into real issues vs. false positives.
5. Fix real issues in `src/content/blog/**`.
6. Re-run `npm run check` until 0 errors; update CLAUDE.md + commit docs.

## Risks & Open Questions
- CJK↔Latin spacing is opinionated and will surface many findings; user opted in.
- Period and colon are ambiguous (decimals, URLs, times) — keep their rules narrow
  to avoid noise; prefer false negatives over false positives there.

## Estimated Complexity
Medium — one script change plus content fixes across up to 12 posts.

## Outcome
Done. Extended the linter (renamed `check-punctuation.mjs` → `check-typography.mjs`,
npm task `check:punct` → `check:typography`) with rules 1–7 above and added the
`lang` frontmatter field (schema + `Base.astro` `<html lang>` + `blog/[slug].astro`).
First run surfaced 11 findings; 6 were false positives from full-width punctuation
(`，。`) living in the broad CJK Unicode range, so the spacing rule was narrowed to
Han-only adjacency (`isHan`). The 5 real issues were fixed in content:
`无 ps 照片` / `月入 3k` / `boss 直聘` (CJK↔Latin spacing) and
`FeHelper（前端助手）` (half-width parens). `npm run check` is green (0 errors).
Deviation from plan: CJK↔Latin spacing was scoped to *letter-bearing* tokens, so
pure numeric+unit (`2018年`) is intentionally left alone — discussed and confirmed.
No autofix (linter only), no new dependencies.

Follow-up: the original plan listed English typography rules as out of scope and
skipped `lang: en` posts. Per a later request, `en` posts are now checked against
an English rule set instead (multiple spaces, space before punctuation, missing
space after a comma/semicolon, spaces hugging parentheses, repeated punctuation),
verified with a throwaway `_`-prefixed fixture (Astro's loader ignores `_*` files;
the linter still walks them).
