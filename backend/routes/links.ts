import { Router, Request, Response } from 'express';
import { CreateLinkSchema, PaginationQuerySchema } from '../schemas/link.schema.js';
import * as linkService from '../services/link.service.js';

export const linksRouter = Router();

// Create short link
linksRouter.post('/', (req: Request, res: Response) => {
  const parseResult = CreateLinkSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.flatten().fieldErrors
    });
  }

  try {
    const { originalUrl, customSlug } = parseResult.data;
    const link = linkService.createLink(originalUrl, customSlug);
    return res.status(201).json(link);
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

// List paginated links
linksRouter.get('/', (req: Request, res: Response) => {
  const queryResult = PaginationQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    return res.status(400).json({
      error: 'Invalid query parameters',
      details: queryResult.error.flatten().fieldErrors
    });
  }

  try {
    const { page, limit, includeDeleted } = queryResult.data;
    const result = linkService.getLinks(page, limit, includeDeleted);
    return res.json(result);
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

// Aggregate stats endpoint
linksRouter.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = linkService.getGlobalStats();
    return res.json(stats);
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

// Single link lookup by shortcode
linksRouter.get('/:shortcode', (req: Request, res: Response) => {
  try {
    const { shortcode } = req.params;
    const link = linkService.getLinkByShortCode(shortcode);
    if (!link) {
      return res.status(404).json({ error: `Short link '${shortcode}' not found` });
    }
    return res.json(link);
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

// Soft-delete / Archive link
linksRouter.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const success = linkService.deleteLink(id);
    if (!success) {
      return res.status(404).json({ error: 'Link not found' });
    }
    return res.json({ success: true, message: 'Link archived' });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
});

// Restore deleted link
linksRouter.post('/:id/restore', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const restored = linkService.restoreLink(id);
    return res.json(restored);
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Failed to restore link' });
  }
});
