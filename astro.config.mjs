// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // Used by RSS, sitemap and canonical URLs. Update if the domain changes.
  site: 'https://blog.royl.uk',
  integrations: [mdx()],
  markdown: {
    // Astro ships Shiki out of the box; just pick a theme.
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
