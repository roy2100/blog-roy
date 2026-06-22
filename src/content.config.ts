import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // Astro 5 Content Layer: load Markdown/MDX, ignoring files prefixed with "_".
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
    description: z.string().optional(),
    // Post language. Drives <html lang> and which typography rules the
    // punctuation linter applies (Chinese rules are skipped for 'en').
    lang: z.enum(['zh', 'en']).default('zh'),
  }),
});

export const collections = { blog };
