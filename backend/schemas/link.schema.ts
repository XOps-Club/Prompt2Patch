import { z } from 'zod';

export const CreateLinkSchema = z.object({
  originalUrl: z
    .string()
    .url('Invalid URL format. Please include http:// or https://')
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === 'http:' || protocol === 'https:';
    }, 'Invalid URL protocol. Only http:// and https:// URLs are supported'),
  customSlug: z
    .string()
    .trim()
    .min(3, 'Slug must be at least 3 characters')
    .max(30, 'Slug must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores')
    .optional()
    .or(z.literal(''))
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  includeDeleted: z
    .preprocess((val) => {
      if (typeof val === 'string') return val === 'true' || val === '1';
      return Boolean(val);
    }, z.boolean())
    .default(false)
});

export const LinkSchema = z.object({
  id: z.number(),
  original_url: z.string().url(),
  short_code: z.string(),
  clicks: z.number(),
  unique_clicks: z.number(),
  conversion_rate: z.number(),
  top_referrer: z.string().nullable().optional(),
  is_deleted: z.number(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional()
});

export const GlobalStatsSchema = z.object({
  totalLinks: z.number(),
  totalClicks: z.number(),
  totalUniqueClicks: z.number(),
  averageConversionRate: z.number(),
  topReferrers: z.array(
    z.object({
      referrer: z.string(),
      count: z.number()
    })
  )
});

export type CreateLinkInput = z.infer<typeof CreateLinkSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type LinkRecord = z.infer<typeof LinkSchema>;
export type GlobalStats = z.infer<typeof GlobalStatsSchema>;
