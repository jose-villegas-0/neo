import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['evidence', 'explainer', 'theory', 'analysis', 'listicle']),
    keywords: z.array(z.string()).default([]),
    heroQuestion: z.string().optional(),
    evidenceStrength: z.number().min(1).max(5).optional(),
    faqs: z
      .array(z.object({ question: z.string(), answer: z.string() }))
      .default([]),
    featured: z.boolean().default(false),
    order: z.number().default(100),
  }),
});

export const collections = { articles };
