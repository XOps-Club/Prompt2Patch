import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'linksnip.db');

export const db = new DatabaseSync(DB_PATH);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_url TEXT NOT NULL,
      short_code TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      unique_clicks INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS click_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_id INTEGER NOT NULL,
      referrer TEXT DEFAULT 'direct',
      user_agent TEXT,
      ip_hash TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
    CREATE INDEX IF NOT EXISTS idx_links_is_deleted ON links(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON click_logs(link_id);
  `);

  // Seed sample records if empty and explicitly requested
  const count = (db.prepare('SELECT COUNT(*) as count FROM links').get() as any).count;
  if (count === 0 && process.env.SEED_DB === 'true') {
    seedDatabase();
  }
}

function seedDatabase() {
  const insertLink = db.prepare(`
    INSERT INTO links (original_url, short_code, clicks, unique_clicks, is_deleted, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertClick = db.prepare(`
    INSERT INTO click_logs (link_id, referrer, user_agent, ip_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const sampleLinks = [
    { url: 'https://github.com/trending', code: 'gh-trend', clicks: 24, unique: 18, daysAgo: 5, isDeleted: 0, referrers: ['github.com', 'twitter.com', 'direct'] },
    { url: 'https://news.ycombinator.com', code: 'hn-front', clicks: 142, unique: 98, daysAgo: 4, isDeleted: 0, referrers: ['hackernews.com', 'linkedin.com', 'direct'] },
    { url: 'https://developer.mozilla.org', code: 'mdn-docs', clicks: 65, unique: 45, daysAgo: 3, isDeleted: 0, referrers: ['google.com', 'direct'] },
    { url: 'https://react.dev', code: 'react19', clicks: 88, unique: 60, daysAgo: 2, isDeleted: 0, referrers: ['twitter.com', 'reddit.com'] },
    { url: 'https://tanstack.com/query', code: 'tanstack', clicks: 31, unique: 22, daysAgo: 1, isDeleted: 0, referrers: ['google.com', 'direct'] },
    { url: 'https://vitejs.dev', code: 'vite-docs', clicks: 19, unique: 14, daysAgo: 1, isDeleted: 0, referrers: ['direct', 'twitter.com'] },
    { url: 'https://sqlite.org', code: 'sqlite-db', clicks: 12, unique: 8, daysAgo: 0, isDeleted: 0, referrers: ['google.com'] },
    { url: 'https://expressjs.com', code: 'express', clicks: 5, unique: 3, daysAgo: 0, isDeleted: 0, referrers: ['direct'] },
    { url: 'https://zod.dev', code: 'zod-types', clicks: 40, unique: 28, daysAgo: 0, isDeleted: 0, referrers: ['twitter.com', 'direct'] },
    { url: 'https://nodejs.org', code: 'node-22', clicks: 15, unique: 11, daysAgo: 0, isDeleted: 0, referrers: ['direct'] },
    { url: 'https://typescriptlang.org', code: 'ts-handbook', clicks: 52, unique: 35, daysAgo: 0, isDeleted: 1, referrers: ['google.com', 'github.com'] },
    { url: 'https://codespaces.new', code: 'cs-new', clicks: 8, unique: 6, daysAgo: 0, isDeleted: 1, referrers: ['github.com'] }
  ];

  for (const item of sampleLinks) {
    const createdAt = new Date(now.getTime() - item.daysAgo * 24 * 3600 * 1000).toISOString();
    const result = insertLink.run(item.url, item.code, item.clicks, item.unique, item.isDeleted, createdAt);
    const linkId = Number(result.lastInsertRowid);

    for (let i = 0; i < item.clicks; i++) {
      const ref = item.referrers[i % item.referrers.length];
      insertClick.run(linkId, ref, 'Mozilla/5.0 Sample Browser', `ip_${i % 10}`, createdAt);
    }
  }
}
