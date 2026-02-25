# Galaxy (GAL) E2E Engineering Test Suite

This document outlines the testing strategy for the Galaxy platform, moving beyond basic "happy path" checks to ensure architectural integrity, multi-tenant security, and integration reliability.

## 1. Tactical Setup
- **Framework**: [Playwright](https://playwright.dev/) (TypeScript)
- **Environment**: `NODE_ENV=test`
- **Database**: Dedicated Supabase `test` project or local Docker instance.
- **Workflow Engine**: Inngest Dev Server (must be running for background job tests).

## 2. P0: The "Iron Curtain" (Security & Isolation)
*Failure here is a non-starter. Every test run MUST verify tenant isolation.*
**Test Cases:** Cross-Tenant Data Leakage and RLS Group Validation are documented inline in `app/src/lib/supabase/server.ts` & `app/src/lib/supabase/client.ts`.

## 3. P0: "Speed to Lead" Reliability
*The platform's core ROI depends on these webhooks.*
**Test Cases:** Idempotent Webhook Handling and Webhook Signature Verification.

## 4. P1: Scheduling & High-Concurrency
**Test Cases:** The "Double Booking" Sprint and Timezone Persistence.

## 5. P1: Lifecycle & State Persistence
**Test Cases:**
- *Onboarding Guard:* Documented inline in `app/src/lib/supabase/middleware.ts` (Next.js Middleware).
- *Token Refresh Mechanics:* Supabase client must seamlessly refresh without dropping the user's state or showing error toast.

## 6. P2: PWA & Performance
### 6.1 PWA Manifest & Service Worker
- **Scenario**: Validate `manifest.json` headers and Service Worker registration status.
- **Assertion**: Service worker is `activated` and `manifest` provides all required icons.
### 6.2 Cold Start Benchmarking
- **Scenario**: Measure the first-load latency of the Unified Inbox.
- **Assertion**: `LCP` (Largest Contentful Paint) must be under 2.5s to ensure performance on mobile networks.

## 7. Execution Workflow

### Run Security Suite (Critical Only)
```bash
pnpm playwright test tests/security/
```

### Run Full Regression
```bash
pnpm playwright test
```

### Codegen (Scenario Recording)
```bash
pnpm playwright codegen http://localhost:3000
```
