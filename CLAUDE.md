# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at http://localhost:4321
npm run build    # static build → ./dist
npm run preview  # serve the built ./dist locally
npm run check    # astro check (types) + check:punct — the lint/test gate
npm run check:punct  # lint Chinese quotation marks in posts (GB/T 15834)
```

There is no unit-test suite. `npm run check` is the correctness gate; it must report 0 errors before a change is considered done. It runs `astro check` (type/diagnostics across `.astro`/`.ts`) followed by `scripts/check-punctuation.mjs`, which enforces Simplified Chinese quotation norms across `src/content/blog/**`: outermost quotes must be full-width `“ ”`, single `‘ ’` only nested inside doubles, and no straight `"` adjacent to CJK text (code fences and inline code are exempt).

## Architecture

Static personal blog built with **Astro 5**, deployed to **Cloudflare Pages**. `plan.md` is the original technical spec (Chinese); `docs/plan-mvp.md` records what Phase 1 actually shipped. Phases 2–3 (tags pages, Pagefind search, OG images, Giscus, R2/D1) are planned but not built.

**Content is the data layer.** `src/content.config.ts` defines the single `blog` collection with a `glob()` loader over `src/content/blog/**/*.{md,mdx}` and a Zod schema. That schema (`title`, `date`, `tags?`, `draft`, `description?`) is the source of truth for post frontmatter — change it there, not ad hoc in pages. A post's **filename is its `id`**, which is also its route: `src/content/blog/foo.md` → `/blog/foo/`.

**Page generation flow:**
- `src/pages/index.astro` — lists posts, sorted by `date` desc.
- `src/pages/blog/[slug].astro` — `getStaticPaths` maps each post `id` to `params.slug`; renders body via `render(post)`.
- `src/pages/rss.xml.ts` — RSS feed at `/rss.xml`.
- All three filter drafts with the same predicate `({ data }) => !data.draft`. Keep this consistent across all collection queries so drafts never leak.

**Astro 5 Content API (important).** Use `post.id` and `render(post)` imported from `astro:content`. Do **not** use the legacy `post.slug` / `post.render()` — `plan.md`'s code snippets show that old API and are out of date.

**Static output, no adapter (deliberate).** Phase 1 is fully static (`getStaticPaths`), so there is no `@astrojs/cloudflare` adapter; Cloudflare Pages serves `./dist` directly. The adapter is only needed when introducing on-demand rendering / D1 / R2 (Phase 3) — see commented bindings in `wrangler.toml`.

**Deployment: Cloudflare Pages only (for now).** Deploy via the Pages Git integration — build command `npm run build`, output directory `dist`. `wrangler.toml` uses `pages_build_output_dir = "./dist"` accordingly. Do **not** switch this project to the Workers deploy flow (`npx wrangler deploy` + an `[assets]` block) unless explicitly asked — that path was evaluated and intentionally deferred. Revisit Workers only when Phase 3 dynamic features (SSR / D1 / R2) actually require it.

**Site URL** lives in `astro.config.mjs` (`site: 'https://blog.royl.uk'`) and drives RSS + canonical URLs; `rss.xml.ts` repeats it as a fallback. Update both if the domain changes.

**Styling** is intentionally plain native CSS in `src/styles/global.css` — CSS variables with light/dark via `prefers-color-scheme`. No Tailwind, by design (see `plan.md`). Code highlighting is Astro's built-in Shiki, configured in `astro.config.mjs` (`github-dark`); `.prose pre` relies on Shiki's inline background.
