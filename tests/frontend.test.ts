import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getQrCodeUrl } from '../frontend/src/services/linkService.js';

describe('LinkSnip Frontend - Client Service Contracts', () => {
  it('generates valid QR code URL on the frontend client', () => {
    assert.strictEqual(getQrCodeUrl(''), '', 'Empty shortUrl should yield empty string');
    const sampleUrl = 'https://linksnip.dev/client-preview?src=ui';
    const qrUrl = getQrCodeUrl(sampleUrl);
    assert.ok(qrUrl && qrUrl.length > 0, 'Frontend getQrCodeUrl must return a functional QR generator endpoint URL');
    assert.ok(qrUrl.startsWith('https://'), 'QR URL must use secure https protocol');
    assert.ok(
      qrUrl.includes(encodeURIComponent(sampleUrl)) || qrUrl.includes(sampleUrl),
      'Frontend QR URL must reference the short URL parameter'
    );
  });
});
