# Galaxy (GAL) E2E Engineering Test Suite

This document outlines the testing strategy for the Galaxy platform, moving beyond basic "happy path" checks to ensure architectural integrity, multi-tenant security, and integration reliability.

## 1. Tactical Setup
- **Framework**: [Playwright](https://playwright.dev/) (TypeScript)
- **Environment**: `NODE_ENV=test`
- **Database**: Dedicated Supabase `test` project or local Docker instance.
- **Workflow Engine**: Inngest Dev Server (must be running for background job tests).

## 2. P0: The "Iron Curtain" (Security & Isolation)
*Failure here is a non-starter. Every test run MUST verify tenant isolation.*

### 2.1 Cross-Tenant Data Leakage
- **Scenario**: Authenticate as `User A` and attempt to access `User B`'s resources (Contact ID, Appointment ID) via direct URL or API hit.
- **Assertion**: Must return `404 Not Found` or `401 Unauthorized`. RLS (Row Level Security) must be the primary line of defense.
### 2.2 RLS Group Validation
- **Scenario**: Bulk insert contacts for `Tenant A` and `Tenant B`. Query `contacts` table as `User A`.
- **Assertion**: Response array length must exactly match `Tenant A` records. No metadata leakage.

## 3. P0: "Speed to Lead" Reliability
*The platform's core ROI depends on these webhooks.*

### 3.1 Idempotent Webhook Handling
- **Scenario**: Simulate a "Missed Call" webhook from Telnyx twice for the same `CallSid`.
- **Assertion**: Only ONE conversation is created, and exactly ONE automated SMS is sent.
### 3.2 Webhook Signature Verification
- **Scenario**: Send a spoofed webhook without the correct Telnyx signature headers.
- **Assertion**: Reject with `401 Unauthorized`.

## 4. P1: Scheduling & High-Concurrency
### 4.1 The "Double Booking" Sprint
- **Scenario**: Use `Promise.all` to submit two identical booking requests for the same calendar slot at the same microsecond.
- **Assertion**: Database constraints must ensure one succeeds while the other fails with a `409 Conflict`.
### 4.2 Timezone Persistence
- **Scenario**: Lead in `London (GMT)` books on a calendar owned by a business in `New York (EST)`.
- **Assertion**: Verify UTC consistency in the database and correct local display for both parties.

## 5. P1: Lifecycle & State Persistence
### 5.1 Onboarding Guard
- **Scenario**: Attempt to force-navigate to `/dashboard/conversations` with an incomplete onboarding session.
- **Assertion**: Middleware must intercept and redirect to the specific step (1-4) where the user left off.
### 5.2 Token Refresh Mechanics
- **Scenario**: Force an expired session and trigger an action.
- **Assertion**: Supabase client must seamlessly refresh without dropping the user's state or showing error toast.

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
