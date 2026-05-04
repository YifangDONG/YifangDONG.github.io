import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    lang: z.enum(['en', 'zh-cn']),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().optional(),
    translationKey: z.string().optional(),
    slug: z.string().optional(),
  }),
});

export const collections = { blog };
