import { db } from '../db.js';
import crypto from 'node:crypto';

export interface LinkWithStats {
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

export function generateRandomSlug(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export function calculateConversionRate(uniqueClicks: number, totalClicks: number): number {
  if (totalClicks === 0) return 0;
  return Math.round((uniqueClicks / totalClicks) * 10000) / 100;
}

/**
 * Generates QR code image URL for a given short URL
 */
export function getQrCodeUrl(shortUrl: string): string {
  if (!shortUrl) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`;
}

export function createLink(originalUrl: string, customSlug?: string): LinkWithStats {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(originalUrl);
  } catch {
    const error: any = new Error('Invalid URL format');
    error.statusCode = 400;
    throw error;
  }
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    const error: any = new Error('Invalid URL protocol. Only http:// and https:// URLs are supported');
    error.statusCode = 400;
    throw error;
  }

  let slug = customSlug?.trim();
  if (!slug) {
    slug = generateRandomSlug(6);
  }

  // Verify if an active link already uses this slug
  const existing = db.prepare('SELECT id FROM links WHERE short_code = ? AND is_deleted = 0').get(slug);
  if (existing) {
    const error: any = new Error(`Slug '${slug}' is already in use`);
    error.statusCode = 409;
    throw error;
  }

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO links (original_url, short_code, clicks, unique_clicks, is_deleted, created_at)
    VALUES (?, ?, 0, 0, 0, ?)
  `);
  const result = insert.run(originalUrl, slug, now);
  const newLink = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid) as any;

  return {
    ...newLink,
    conversion_rate: 0,
    top_referrer: 'direct'
  };
}

export function getLinks(page: number = 1, limit: number = 10, includeDeleted: boolean = false) {
  const offset = Math.max(0, (page - 1) * limit);

  const whereClause = includeDeleted ? 'WHERE is_deleted = 1' : 'WHERE is_deleted = 0';
  const countRow = db.prepare(`SELECT COUNT(*) as total FROM links ${whereClause}`).get() as any;
  const total = countRow.total;

  const rows = db.prepare(`
    SELECT * FROM links
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as any[];

  const links: LinkWithStats[] = rows.map((row) => {
    // Get top referrer for this link
    const topRefRow = db.prepare(`
      SELECT referrer, COUNT(*) as cnt 
      FROM click_logs 
      WHERE link_id = ? 
      GROUP BY referrer 
      ORDER BY cnt DESC 
      LIMIT 1
    `).get(row.id) as any;

    return {
      ...row,
      conversion_rate: calculateConversionRate(row.unique_clicks, row.clicks),
      top_referrer: topRefRow ? topRefRow.referrer : 'direct'
    };
  });

  return {
    data: links,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export function getLinkById(id: number): LinkWithStats | null {
  const row = db.prepare('SELECT * FROM links WHERE id = ?').get(id) as any;
  if (!row) return null;

  const topRefRow = db.prepare(`
    SELECT referrer, COUNT(*) as cnt 
    FROM click_logs 
    WHERE link_id = ? 
    GROUP BY referrer 
    ORDER BY cnt DESC 
    LIMIT 1
  `).get(row.id) as any;

  return {
    ...row,
    conversion_rate: calculateConversionRate(row.unique_clicks, row.clicks),
    top_referrer: topRefRow ? topRefRow.referrer : 'direct'
  };
}

export function getLinkByShortCode(shortCode: string): any {
  return db.prepare('SELECT * FROM links WHERE short_code = ? AND is_deleted = 0').get(shortCode);
}

export function recordClick(linkId: number, referrer?: string, ip?: string, userAgent?: string) {
  const cleanReferrer = referrer ? new URL(referrer).hostname : 'direct';
  const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16) : 'unknown';

  // Check if unique click from this IP
  const priorClick = db.prepare('SELECT id FROM click_logs WHERE link_id = ? AND ip_hash = ?').get(linkId, ipHash);
  const isUnique = !priorClick;

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO click_logs (link_id, referrer, user_agent, ip_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(linkId, cleanReferrer, userAgent || '', ipHash, now);

  if (isUnique) {
    db.prepare('UPDATE links SET clicks = clicks + 1, unique_clicks = unique_clicks + 1 WHERE id = ?').run(linkId);
  } else {
    db.prepare('UPDATE links SET clicks = clicks + 1 WHERE id = ?').run(linkId);
  }
}

/**
 * Soft-deletes / archives a link by ID
 */
export function deleteLink(id: number): boolean {
  const result = db.prepare('UPDATE links SET is_deleted = 1, updated_at = ? WHERE id = ? AND is_deleted = 0').run(
    new Date().toISOString(),
    id
  );
  return result.changes > 0;
}

/**
 * Restores an archived link by ID back to active status
 */
export function restoreLink(id: number): LinkWithStats {
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(id) as any;
  if (!link) {
    const err: any = new Error('Link not found');
    err.statusCode = 404;
    throw err;
  }

  const conflictingLink = db
    .prepare('SELECT id FROM links WHERE short_code = ? AND is_deleted = 0 AND id != ?')
    .get(link.short_code, id);
  if (conflictingLink) {
    const err: any = new Error(`Slug '${link.short_code}' is already in use`);
    err.statusCode = 409;
    throw err;
  }

  db.prepare('UPDATE links SET is_deleted = 0, updated_at = ? WHERE id = ? AND is_deleted = 1').run(
    new Date().toISOString(),
    id
  );

  return getLinkById(id)!;
}

/**
 * Computes aggregate statistics across active links and click analytics
 */
export function getGlobalStats() {
  const linksSummary = db.prepare(`
    SELECT 
      COUNT(*) as totalLinks,
      COALESCE(SUM(clicks), 0) as totalClicks,
      COALESCE(SUM(unique_clicks), 0) as totalUniqueClicks
    FROM links
    WHERE is_deleted = 0
  `).get() as any;

  const topReferrers = db.prepare(`
    SELECT referrer, COUNT(*) as count
    FROM click_logs
    GROUP BY referrer
    ORDER BY count DESC
    LIMIT 5
  `).all() as any[];

  const avgConversion = calculateConversionRate(
    linksSummary.totalUniqueClicks,
    linksSummary.totalClicks
  );

  return {
    totalLinks: linksSummary.totalLinks,
    totalClicks: linksSummary.totalClicks,
    totalUniqueClicks: linksSummary.totalUniqueClicks,
    averageConversionRate: avgConversion,
    topReferrers
  };
}
