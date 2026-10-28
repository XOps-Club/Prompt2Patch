import express, { Request, Response } from 'express';
import cors from 'cors';
import { initDatabase } from './db.js';
import { linksRouter } from './routes/links.js';
import * as linkService from './services/link.service.js';

export const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
initDatabase();

// Mount link management routes
app.use('/links', linksRouter);
app.use('/api/links', linksRouter);

// Top-level redirect endpoint (/:code)
app.get('/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  
  // Ignore favicon or internal requests
  if (code === 'favicon.ico' || code === 'robots.txt') {
    return res.status(404).end();
  }

  const link = linkService.getLinkByShortCode(code);
  if (!link) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Link Not Found</title></head>
        <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: #f8fafc;">
          <div style="text-align: center;">
            <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">404 - Link Not Found</h1>
            <p style="color: #94a3b8;">The short link "<b>${code}</b>" does not exist or has been archived.</p>
          </div>
        </body>
      </html>
    `);
  }

  // Record click analytics
  const referrer = req.headers.referer || req.headers.referrer;
  const ip = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  linkService.recordClick(link.id, Array.isArray(referrer) ? referrer[0] : referrer, ip, userAgent);

  return res.redirect(link.original_url);
});

const isMain = process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));
if (isMain) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinkSnip Server running on http://localhost:${PORT}`);
  });
}
