// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Used by RSS, sitemap and canonical URLs. Update if the domain changes.
  site: 'https://blog.royl.uk',
  markdown: {
    // Astro ships Shiki out of the box; just pick a theme.
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
