import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The visual editor writes a blank field as "" or null rather than leaving it
// out, so optional text treats all three the same: not set.
const optionalText = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v : undefined));

const work = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/._*'], base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    tag: z.string(),
    cover: z.string(),
    // optional silent loop: plays on card hover, loops in the case study hero
    video: optionalText,
    excerpt: optionalText,
    order: z.number().nullish().transform((v) => v ?? 99),
    year: optionalText,
    role: optionalText,
    client: optionalText,
    services: z.array(z.string()).optional(),
    link: optionalText,
    // draft: shown on the dev server, left out of the production build
    draft: z.boolean().default(false),
    // short name for the case study hero; defaults to the title before " — "
    heroTitle: optionalText,
    // the question cards, each tied to a chapter by its ## heading. `show`
    // switches a question off without losing what's written for it.
    questions: z
      .array(
        z.object({
          chapter: z.string(),
          question: z.string(),
          show: z.boolean().default(true),
          answer: z.string().nullish().transform((v) => v ?? ''),
        })
      )
      .default([]),
    // private notes for the author; never rendered
    notes: optionalText,
    // full-screen image carousel, placed after one chapter. On a wide screen
    // it pins and the images travel sideways as the page scrolls; on a phone
    // it is a plain vertical run of images.
    gallery: z
      .object({
        show: z.boolean().default(false),
        after: optionalText,
        // an item added in the editor but left without a picture is skipped,
        // not a reason to refuse the whole site
        items: z
          .array(z.object({ image: optionalText, caption: optionalText }))
          .default([])
          .transform((items) =>
            items.filter((i): i is { image: string; caption?: string } => !!i.image)
          ),
      })
      .optional(),
    // metric cards, shown in one chapter just above its questions.
    //   show:    switch the whole block on or off without deleting it
    //   chapter: the ## heading it sits under (defaults to the first chapter)
    //   note:    small line under the cards, e.g. "Data correct as of Sept 2026"
    stats: z
      .object({
        show: z.boolean().default(false),
        chapter: optionalText,
        note: optionalText,
        items: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
      })
      .optional(),
  }),
});

export const collections = { work };
