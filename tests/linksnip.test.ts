import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import { app } from '../backend/server.js';
import { db } from '../backend/db.js';
import * as linkService from '../backend/services/link.service.js';

describe('LinkSnip - Standard API Features', () => {
  it('creates a new short link with auto-generated slug', () => {
    const link = linkService.createLink('https://example.com/unique-test-1');
    assert.ok(link);
    assert.strictEqual(link.original_url, 'https://example.com/unique-test-1');
    assert.ok(link.short_code);
    assert.strictEqual(link.short_code.length, 6);
    assert.strictEqual(link.is_deleted, 0);
  });

  it('rejects duplicate custom slugs on initial creation', () => {
    const slug = 'unique-slug-' + Math.random().toString(36).substring(2, 8);
    linkService.createLink('https://example.com/a', slug);
    assert.throws(() => {
      linkService.createLink('https://example.com/b', slug);
    }, /already in use/);
  });

  it('accepts only http and https target URLs', () => {
    assert.throws(
      () => linkService.createLink('javascript:alert(1)'),
      (err: any) => err.statusCode === 400 && /Only http:\/\/ and https:\/\//.test(err.message)
    );
    assert.throws(
      () => linkService.createLink('file:///etc/passwd'),
      (err: any) => err.statusCode === 400 && /Only http:\/\/ and https:\/\//.test(err.message)
    );
    assert.ok(linkService.createLink('http://example.com/allowed'));
  });

  it('records clicks and updates click count', () => {
    const link = linkService.createLink('https://example.com/click-test');
    linkService.recordClick(link.id, 'https://twitter.com', '127.0.0.1');
    linkService.recordClick(link.id, 'https://twitter.com', '127.0.0.1'); // same IP
    linkService.recordClick(link.id, 'https://google.com', '192.168.1.1'); // new IP

    const updated = linkService.getLinkById(link.id);
    assert.strictEqual(updated?.clicks, 3);
    assert.strictEqual(updated?.unique_clicks, 2);
  });

  it('normalizes localhost identities and ignores malformed referrers', () => {
    const link = linkService.createLink('https://example.com/local-click-test');
    assert.doesNotThrow(() => {
      linkService.recordClick(link.id, 'not-a-url', '::1');
      linkService.recordClick(link.id, undefined, '127.0.0.1');
    });

    const updated = linkService.getLinkById(link.id);
    assert.strictEqual(updated?.clicks, 2);
    assert.strictEqual(updated?.unique_clicks, 1);
    assert.strictEqual(updated?.conversion_rate, 50);
  });

  it('calculateConversionRate preserves fractional percentages', () => {
    const rate1 = linkService.calculateConversionRate(7, 10);
    assert.strictEqual(rate1, 70);

    const rate2 = linkService.calculateConversionRate(4, 10);
    assert.strictEqual(rate2, 40);

    const rate3 = linkService.calculateConversionRate(1, 3);
    assert.ok(rate3 > 33 && rate3 < 34);
  });

  it('Page 1 returns the first batch of URLs starting from offset 0', () => {
    const page1 = linkService.getLinks(1, 10);
    assert.ok(page1.data.length > 0);

    const allLinks = (db.prepare('SELECT * FROM links WHERE is_deleted = 0 ORDER BY id DESC').all() as any[]);
    assert.strictEqual(page1.data[0].id, allLinks[0].id);
  });

  it('isolates pagination total and totalPages between active and archived views', () => {
    // Clear existing for clean count verification
    db.exec('DELETE FROM click_logs; DELETE FROM links;');

    const l1 = linkService.createLink('https://example.com/p1');
    const l2 = linkService.createLink('https://example.com/p2');
    const l3 = linkService.createLink('https://example.com/p3');
    const l4 = linkService.createLink('https://example.com/p4');
    const l5 = linkService.createLink('https://example.com/p5');
    linkService.deleteLink(l4.id);
    linkService.deleteLink(l5.id);

    const activePage = linkService.getLinks(1, 10, false);
    const archivedPage = linkService.getLinks(1, 10, true);

    assert.strictEqual(activePage.pagination.total, 3, 'Active view total should only count active links');
    assert.strictEqual(archivedPage.pagination.total, 2, 'Archived view total should only count archived links');
  });
});

describe('LinkSnip - Core Link Operations & Analytics', () => {
  it('generates QR code URL for created links with parameter encoding', () => {
    assert.strictEqual(linkService.getQrCodeUrl(''), '');
    const testUrl = 'https://linksnip.dev/test123?campaign=hackathon&medium=social';
    const qrUrl = linkService.getQrCodeUrl(testUrl);
    assert.ok(qrUrl && qrUrl.length > 0, 'Expected valid QR code URL');

    const parsed = new URL(qrUrl);
    assert.ok(parsed.protocol === 'https:' || parsed.protocol === 'http:');

    const encodedTarget = encodeURIComponent(testUrl);
    assert.ok(
      qrUrl.includes(`data=${encodedTarget}`) || qrUrl.includes(`chl=${encodedTarget}`),
      'QR generator must properly URI-encode destination URL to prevent query parameter collision'
    );
  });

  it('aggregates active links and visitor metrics in /links/stats', async () => {
    const server = app.listen(0);
    const port = (server.address() as any).port;
    try {
      const response = await fetch(`http://localhost:${port}/links/stats`);
      const data: any = await response.json();
      assert.strictEqual(response.status, 200, 'Expected 200 OK status');
      assert.strictEqual(typeof data.totalClicks, 'number', 'Expected totalClicks to be a number');
      assert.strictEqual(typeof data.totalUniqueClicks, 'number', 'Expected totalUniqueClicks to be a number');
      assert.strictEqual(typeof data.averageConversionRate, 'number', 'Expected averageConversionRate to be a number');
      assert.strictEqual(typeof data.totalLinks, 'number', 'Expected totalLinks metric to be present in telemetry response');
      assert.ok(data.totalLinks > 0, 'Expected active links count to be positive');
    } finally {
      server.close();
    }
  });

  it('excludes archived link clicks from top referrer telemetry', () => {
    const active = linkService.createLink('https://example.com/active-referrer');
    const archived = linkService.createLink('https://example.com/archived-referrer');
    linkService.recordClick(active.id, 'https://active.example');
    linkService.recordClick(archived.id, 'https://archived.example');
    linkService.deleteLink(archived.id);

    const stats = linkService.getGlobalStats();
    assert.ok(stats.topReferrers.some((item) => item.referrer === 'active.example'));
    assert.ok(!stats.topReferrers.some((item) => item.referrer === 'archived.example'));
  });

  it('archives active link on delete', () => {
    const link = linkService.createLink('https://example.com/delete-test-op');
    const success = linkService.deleteLink(link.id);
    assert.strictEqual(success, true, 'deleteLink should return true');

    const updated = db.prepare('SELECT is_deleted FROM links WHERE id = ?').get(link.id) as any;
    assert.strictEqual(updated.is_deleted, 1, 'Active link should be archived after delete');

    const check = linkService.getLinkByShortCode(link.short_code);
    assert.strictEqual(check, undefined, 'Archived link should not be active');
  });

  it('restores archived link back to active state', () => {
    const link = linkService.createLink('https://example.com/restore-test-op');
    db.prepare('UPDATE links SET is_deleted = 1 WHERE id = ?').run(link.id);

    const restored = linkService.restoreLink(link.id);
    assert.strictEqual(restored.is_deleted, 0, 'Archived link should be restored to active status');

    const check = linkService.getLinkByShortCode(link.short_code);
    assert.ok(check, 'Expected link to be active after restore');
  });

  it('rejects restoring an archived link if its slug has been claimed by another active link (409 Conflict)', () => {
    const slug = 'slug-collision-' + Math.random().toString(36).substring(2, 8);
    const link1 = linkService.createLink('https://example.com/site-1', slug);
    db.prepare('UPDATE links SET is_deleted = 1 WHERE id = ?').run(link1.id);

    const link2 = linkService.createLink('https://example.com/site-2', slug);
    assert.strictEqual(link2.short_code, slug);

    assert.throws(() => {
      linkService.restoreLink(link1.id);
    }, (err: any) => {
      return err.statusCode === 409;
    }, 'Expected 409 Conflict when restoring link with colliding active slug');
  });

  after(() => {
    db.exec('DELETE FROM click_logs; DELETE FROM links; VACUUM;');
  });
});
