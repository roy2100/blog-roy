# Plan: Astro Blog — Phase 1 MVP

## Goal
Scaffold a deployable static blog with Astro per `plan.md`, covering Phase 1: article
list, article detail pages, Shiki code highlighting, RSS feed, and a base layout, ready
for Cloudflare Pages auto-deploy on `git push`.

## Scope
**Included (Phase 1 MVP)**
- Astro project (package.json, astro.config.mjs, tsconfig.json)
- Content Collections (`src/content.config.ts`) with Zod schema + `glob()` loader
- Article list homepage (`/`)
- Article detail dynamic route (`/blog/[slug]`)
- Code highlighting via Astro's built-in Shiki (zero config)
- RSS feed (`/rss.xml`) via `@astrojs/rss`
- MDX support via `@astrojs/mdx`
- Base layout + native CSS (CSS variables, dark mode via `prefers-color-scheme`)
- 2 sample posts
- `wrangler.toml` + README deploy notes

**Out of scope** (deferred to Phase 2/3): tags pages, Pagefind search, OG image
generation, reading-time, Giscus comments, R2/D1 bindings.

## Decisions / deviations from plan.md
- **Static output, no Cloudflare adapter.** Phase 1 is fully static (`getStaticPaths`).
  The `@astrojs/cloudflare` adapter is only needed for on-demand/SSR (Phase 3 D1/R2).
  Cloudflare Pages serves `./dist` directly. The adapter is added later when needed.
- **Current Astro 5+ Content API.** `plan.md` snippets use the legacy `post.slug` /
  `post.render()`. Use `post.id` + `render(post)` and a `glob()` loader instead.
- Schema field is `date` (per plan.md), `draft` filtered out in queries.

## Steps
1. Write package.json + install deps (astro, @astrojs/rss, @astrojs/mdx).
2. astro.config.mjs (site URL, mdx integration) + tsconfig.json.
3. `src/content.config.ts` — blog collection, glob loader, Zod schema.
4. Base layout + global CSS (variables, light/dark, typographic defaults).
5. Homepage list, `[slug].astro` detail, `rss.xml.ts`.
6. Sample posts incl. a code-heavy one to exercise Shiki.
7. wrangler.toml + README; `astro check`/`build` to verify.

## Risks & Open Questions
- Site domain assumed `https://royl.uk` (from plan.md); adjust if different.
- npm install reaches the network; failure blocks build verification.

## Estimated Complexity
Low — standard Astro scaffold, all static, well-trodden path.

## Outcome
Built Phase 1 MVP. Created package.json (astro 5, @astrojs/mdx, @astrojs/rss),
astro.config.mjs (site `https://royl.uk`, Shiki `github-dark` + wrap), tsconfig,
`src/content.config.ts` (glob loader + Zod schema), Base layout + native CSS with
light/dark via `prefers-color-scheme`, homepage list, `blog/[slug].astro` detail,
`rss.xml.ts`, two sample posts (one MDX exercising Shiki), favicon, wrangler.toml,
README. Added `.astro/` to .gitignore.

Verification: `npm install` (413 pkgs), `npm run build` → 3 pages + /rss.xml, static
output; `npm run check` → 0 errors / 0 warnings / 0 hints.

Deviations from plan.md: used current Astro 5 Content API (`post.id` + `render(post)`,
glob loader) instead of legacy `post.slug` / `post.render()`; static output with **no**
Cloudflare adapter (not needed until SSR/D1/R2 in Phase 3). Not committed/pushed —
awaiting user go-ahead.
