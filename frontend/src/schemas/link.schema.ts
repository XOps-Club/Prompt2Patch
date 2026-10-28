import { z } from 'zod';

export const ShortenInputSchema = z.object({
  originalUrl: z
    .string()
    .min(1, 'Please enter a URL')
    .url('Please enter a valid URL (must start with http:// or https://)'),
  customSlug: z
    .string()
    .trim()
    .max(30, 'Slug cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]*$/, 'Slug can only contain alphanumeric characters, dashes, and underscores')
    .optional()
});

export type ShortenInput = z.infer<typeof ShortenInputSchema>;

export interface LinkItem {
  id: number;
  original_url: string;
  short_code: string;
  clicks: number;
  unique_clicks: number;
  conversion_rate: number;
  top_referrer?: string | null;
  is_deleted: number;
  created_at: string;
  updated_at?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LinksResponse {
  data: LinkItem[];
  pagination: PaginationMeta;
}

export interface GlobalStatsResponse {
  totalLinks: number;
  totalClicks: number;
  totalUniqueClicks: number;
  averageConversionRate: number;
  topReferrers: { referrer: string; count: number }[];
}
