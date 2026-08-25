import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    tag: z.string(),
    cover: z.string(),
    excerpt: z.string().optional(),
    order: z.number().default(99),
  }),
});

export const collections = { work };
