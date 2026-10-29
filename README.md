# LinkSnip - URL Shortener & Analytics Dashboard

LinkSnip is a high-performance, compact URL shortener and real-time analytics dashboard built with Node.js, Express, SQLite, React, TanStack Query, and Zod.

## Features
- **Instant URL Shortening**: Create fast, reliable short links with custom or auto-generated slugs.
- **Real-Time Click Analytics**: Track total clicks, unique visitors, referrers, and conversion rates.
- **Responsive Dashboard**: Minimal UI overhead with a landing input card and metrics table.
- **Link Management**: Archive (soft-delete) and restore links seamlessly.
- **Developer Ready**: SQLite-backed with no external database setup needed.

## Tech Stack
- **Backend**: Node.js, Express, SQLite (`node:sqlite`), Zod
- **Frontend**: React 18, Vite, TanStack Query v5, Zod, Lucide Icons
- **Testing**: Node.js Test Runner (`node:test`)
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3002`

## Getting Started

### Installation
```bash
npm install
```

### Development
Start both frontend and backend concurrently:
```bash
npm run dev
# Or with Makefile
make dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3002`

### Running Tests
```bash
npm test
# Or with Makefile
make test
```

## API Endpoints
- `POST /links`: Shorten a URL (`{ originalUrl, customSlug? }`)
- `GET /links?page=1&limit=10`: List paginated active links
- `GET /links/stats`: Global analytics overview
- `GET /links/:id`: Get detailed link metrics
- `DELETE /links/:id`: Archive a link
- `POST /links/:id/restore`: Restore an archived link
- `GET /:code`: Redirect shortcode to destination URL

---

## 🛠️ Incident Report: Reported Defects & Mission Brief

Your engineering squad has received production incident reports regarding several critical regressions in LinkSnip:

1. **INC-01: Lifecycle Archive Failure**
   - *Symptom*: When an operator archives a link (`DELETE /links/:id`), the database state remains active, allowing short code redirection to continue.
2. **INC-02: Slug Collision on Restore**
   - *Symptom*: Restoring an archived link does not verify if its slug was claimed by another active link in the interim, causing state collisions.
3. **INC-03: Telemetry Dashboard Desync**
   - *Symptom*: The `/links/stats` endpoint and telemetry cards fail to return the active link count.
4. **INC-04: Pagination Bleed**
   - *Symptom*: Navigating pages in the active links directory counts archived records towards the total link count.
5. **INC-05: Missing QR Generator Implementation**
   - *Symptom*: QR code previews return empty strings on both the backend service and the client-side helper (`linkService.ts`).
6. **INC-06: Strict Target URL Protocol Enforcement**
   - *Symptom*: The service layer must strictly reject unsupported protocols (`javascript:`, `file:`, etc.) and ensure only valid `http://` and `https://` URLs are accepted.

## Incident Resolution

All six incidents were reproduced against the baseline and fixed:

1. `deleteLink` now archives with `is_deleted = 1`, and archived links remain excluded from redirects.
2. `restoreLink` checks for an active link using the same slug and returns a `409` conflict instead of restoring into a collision.
3. Active-link stats now return `totalLinks` from the aggregate query, which feeds the dashboard telemetry card.
4. Pagination totals now use the same active/archived filter as the page data.
5. Backend and frontend QR helpers now return an encoded HTTPS QR Server URL for non-empty inputs.
6. Backend service validation and both request schemas accept only `http:` and `https:` URLs.

Additional verified fixes:

- The QR modal now opens from the QR preview action.
- Header items without implemented destinations are disabled instead of linking to missing sections.
- Archived-link clicks are excluded from global referrer telemetry.
- Malformed referrer headers no longer break redirect analytics.
- Loopback IPv4/IPv6 addresses are normalized as one local visitor; missing IPs are not counted as unique.
- The directory returns to the last valid page after archiving its final item.

Verification:

```bash
npm test       # 13 tests passed
npm run build  # TypeScript and Vite build passed
```

---

## 🎯 Evaluation Criteria
Judges evaluate your submission based on:
1. **Public & Hidden Test Suites**: All public tests (`make test`) and hidden judge checks (`eval_hidden`) must pass.
2. **Surgical Precision**: Minimal, focused diffs without unnecessary formatting rewrites or bloated AI boilerplate.
3. **Prompt Engineering Evidence**: Documented prompt sequences in `NOTES.md` demonstrating structured reasoning.
4. **Live Code Defense**: Defending your diagnosis and solutions during judge Q&A.
