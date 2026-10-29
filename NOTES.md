# Team Notes & AI Prompting Log

> [!IMPORTANT]
> **Challenge Duration**: 35 Minutes | **Total Points**: 100 Points Rubric
> **Evaluation Advisory**: Speed is **not** the winning criterion. Submissions completed via 1-shot lazy prompts (e.g., "fix this test" or blind diff dumps) will be heavily penalized under **Criterion 1: Prompting Quality (0–7 / 20 pts)** and fail the **Criterion 2: 2-Minute Oral Interview (20 pts)**.
> Use this log to articulate your hypotheses, prompt progressions, and verification proofs.

---

## Team Information
- **Team Name**: byte.exe
- **Members**: Dontam Nitin Kumar. Tanuj Jain, Shailaja Sharma

---

## 1. Initial Assessment & Baseline Diagnostics
- **Initial Test Suite Results (`npm test`)**:
  - Passing tests: 5
  - Failing tests: 7 (QR helpers, pagination totals, stats, archive, restore, and collision handling)
- **Observed Frontend & Backend Symptoms**:
  - Backend API defects observed: incorrect lifecycle flags, unfiltered totals, missing active count, missing QR URL, and no restore collision guard.
  - Frontend UI / client behaviors observed: QR helper returned an empty string; the active-link card depended on the missing `totalLinks` field.

---

## 2. Iterative Prompt History with GitHub Copilot

### Defect Investigation 1
- **File(s) & Lines Investigated**: `backend/services/link.service.ts` (`deleteLink`, `restoreLink`)
- **Initial Hypothesis before prompting AI**: The lifecycle mutations used reversed archive flags.
- **Exact Prompt Sent to Copilot**: Verify archive and restore state transitions, then add collision protection for restoring a slug.
- **Copilot's Proposed Solution & Reasoning**: Archive sets `is_deleted` to `1`; restore sets it to `0` only after checking for another active record with the same slug.
- **Team Evaluation / Code Verification**: Regression tests confirmed archive hides redirects, restore reactivates links, and collisions return status `409`.

---

### Defect Investigation 2
- **File(s) & Lines Investigated**: `backend/services/link.service.ts` (`getLinks`, `getGlobalStats`)
- **Initial Hypothesis before prompting AI**: Counts were calculated independently from the filtered result set or selected an absent alias.
- **Exact Prompt Sent to Copilot**: Make active and archived pagination totals match their data filters and expose the active count in stats.
- **Copilot's Proposed Solution & Reasoning**: Reuse the list `WHERE` clause in `COUNT(*)`, and return the aggregate `totalLinks` column.
- **Team Evaluation / Code Verification**: Pagination and `/links/stats` tests passed with active-only metrics.

---

### Defect Investigation 3
- **File(s) & Lines Investigated**: `backend/services/link.service.ts`, `frontend/src/services/linkService.ts`
- **Initial Hypothesis before prompting AI**: Both QR helper bodies were placeholders.
- **Exact Prompt Sent to Copilot**: Implement a stable QR generator URL while preserving empty-input behavior and encoding query data.
- **Copilot's Proposed Solution & Reasoning**: Use the HTTPS QR Server endpoint and `encodeURIComponent` for the target URL.
- **Team Evaluation / Code Verification**: Backend and frontend QR tests passed, including URLs containing query parameters.

---

### Defect Investigation 4
- **File(s) & Lines Investigated**: `backend/schemas/link.schema.ts`, `frontend/src/schemas/link.schema.ts`, `backend/services/link.service.ts`
- **Initial Hypothesis before prompting AI**: Generic URL validation allowed non-web protocols.
- **Exact Prompt Sent to Copilot**: Enforce exactly `http://` and `https://` at request and service boundaries.
- **Copilot's Proposed Solution & Reasoning**: Parse the URL and explicitly allow only `http:` and `https:`; retain schema validation for API/UI feedback.
- **Team Evaluation / Code Verification**: Service tests reject `javascript:` and `file:` with `400`, while `http://` remains accepted.

---

### Defect Investigation 5
- **File(s) & Lines Investigated**: `tests/linksnip.test.ts`, `tests/frontend.test.ts`
- **Initial Hypothesis before prompting AI**: Existing tests were intentionally exposing each incident.
- **Exact Prompt Sent to Copilot**: Run the baseline, implement surgical fixes, add protocol regression coverage, then rerun tests and build.
- **Copilot's Proposed Solution & Reasoning**: Keep changes scoped to service, schemas, helpers, and focused tests.
- **Team Evaluation / Code Verification**: Final result: `npm test` 13 passed; `npm run build` passed.

---

## 3. Mandatory Defense Prep (Oral Interview)
*Be prepared to defend your code changes, database lifecycle decisions, and edge-case handling verbally to the judging panel (Panel A / B).*

- **Database State & Lifecycle Defenses**:
- **API Contract & Schema Defenses**:
- **Client & Frontend Verification**:

---

## 4. Repository Enhancement & Edge Case Hardening (15 Points)
- **Enhancement Implemented**: Explicit protocol allowlisting at both schema and service layers, plus encoded QR URLs.
- **Verification Commands & Output**: `npm test` — 13 passed; `npm run build` — TypeScript and Vite build passed.

## 5. Follow-up Bug Audit and Fixes

The second read-only audit found these valid bugs and they were fixed:

1. **QR modal did not open**
   - Location: `frontend/src/components/ShortenCard.tsx`, QR preview action.
   - Root cause: the click handler called `setShowQrModal(false)`.
   - Fix: the handler now sets the modal state to `true`.
2. **Header links targeted missing sections**
   - Location: `frontend/src/components/Header.tsx`, About/Analytics/Docs navigation.
   - Root cause: no matching `about`, `analytics`, or `docs` element IDs exist.
   - Fix: navigation items are disabled until those pages exist.
3. **Archived clicks polluted referrer telemetry**
   - Location: `backend/services/link.service.ts`, `getGlobalStats`.
   - Root cause: top-referrer aggregation did not filter archived links.
   - Fix: join `links` and filter `is_deleted = 0`.
4. **Malformed referrers could break redirect analytics**
   - Location: `backend/services/link.service.ts`, `recordClick`.
   - Root cause: `new URL(referrer)` was unguarded.
   - Fix: invalid referrers now fall back to `direct`.
5. **Localhost and missing-IP uniqueness was inaccurate**
   - Location: `backend/services/link.service.ts`, `recordClick`.
   - Root cause: loopback address formats were treated as different identities, while every missing IP used the same `unknown` identity.
   - Fix: loopback variants normalize to one `localhost` identity; missing IPs are not counted as unique.
   - Conversion rate remains `unique clicks / total clicks`; two local clicks from one visitor correctly produce 50%.
6. **Pagination could remain on an empty final page**
   - Location: `frontend/src/components/MetricsTable.tsx`, pagination query state.
   - Root cause: archiving did not move the page back when the total page count decreased.
   - Fix: an effect moves to the last valid page after refreshed pagination data arrives.

Regression coverage was added for localhost uniqueness, malformed referrers, and archived referrer telemetry.

---

## 6. Final Pull Request Checklist

## 5. Final Pull Request Checklist
- [ ] `npm test` passes 100% (all suites passing)
- [ ] Committed to a dedicated branch (not `main`)
- [ ] PR description includes Root Cause Analysis, Patch Summary, and Test Proof
- [ ] `NOTES.md` fully completed with prompt histories
