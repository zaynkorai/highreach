# Senior Principal Engineer Review — GHL Lite

**Documents:** [lite.md](file:///Users/zayn/ground/gal/lite.md) | [staff.md](file:///Users/zayn/ground/gal/staff.md) | [po.md](file:///Users/zayn/ground/gal/po.md)  
**Review Date:** January 22, 2026  
**Reviewer:** Senior Principal Engineer  
**Review Type:** Final Engineering Signoff

---

## 📋 Architecture Summary

### Proposed Stack
| Layer | Technology | Assessment |
|-------|------------|------------|
| Frontend | Next.js 15 (App Router) + Tailwind | ✅ Solid |
| Backend | Next.js API Routes | ⚠️ See concerns |
| Database | Supabase (PostgreSQL + RLS) | ✅ Good for scale |
| Email | Resend | ✅ Modern, reliable |
| SMS/Phone | Telnyx | ✅ Cost-effective |
| Workflows | Inngest | ✅ Serverless-friendly |
| AI | Vercel AI SDK + Claude/GPT-4o | ✅ Standard |
| Auth | Supabase Auth | ✅ Built-in |
| Hosting | Vercel | ✅ Zero-config |

---

## 🔍 Principal Engineer Assessment

### ✅ APPROVED — No Changes Needed

| Decision | Reasoning |
|----------|-----------|
| **Supabase + RLS** | Correct for 50k+ tenants. RLS scales well. |
| **Telnyx over Twilio** | 50% cost savings validated. API is mature. |
| **Resend for email** | Better DX than Mailgun, good deliverability. |
| **Inngest for workflows** | Eliminates Redis ops burden. Good for "wait → action" patterns. |
| **PWA approach** | Correct. Native apps are unnecessary complexity for P0. |
| **"25% for 90%" AI strategy** | Smart resource allocation. Avoid Voice AI infra. |

---

### ⚠️ CONCERNS — Requires Mitigation

| Concern | Risk | Mitigation | Owner |
|---------|------|------------|-------|
| **API Routes at scale** | Next.js API routes have cold start latency. At 50k tenants, may hit Vercel limits. | Monitor. Plan migration to separate Hono/Fastify service if >10k MAU. | Eng Lead |
| **Supabase connection limits** | Free/Pro tier has connection limits (50-500). High concurrency could exhaust. | Use connection pooling (PgBouncer built into Supabase). Pool mode: transaction. | Backend |
| **Telnyx number provisioning** | Number availability varies by region. | Test sandbox NOW. Confirm US number availability before launch. | DevOps |
| **Inngest vendor lock-in** | Workflow logic is Inngest-specific. | Abstract workflow definitions. Document migration path to Temporal if needed. | Arch |
| **Real-time inbox** | "Unified inbox" implies websockets. Supabase Realtime has limits. | Use Supabase Realtime for P0. Budget for Ably/Pusher if >5k concurrent. | Backend |

---

### ❌ BLOCKERS — Must Address Before P0

| Blocker | Impact | Resolution Required |
|---------|--------|---------------------|
| **Google Business Profile API** | Review request feature is P1, but API approval takes 2-4 weeks. | **Apply TODAY.** Cannot ship Reviews feature without it. |
| **Telnyx sandbox testing** | Missed call text-back is P0. Untested = launch risk. | Complete sandbox test by Day 3 of development. |
| **Multi-tenant auth flow** | User signs up → which tenant? Invite flow? | Document auth/tenant flow before coding. |

---

## 🏗️ Architecture Recommendations

### 1. Database Schema Principles
```
Every table MUST have:
- id (uuid, primary key)
- tenant_id (uuid, foreign key, indexed)
- created_at, updated_at (timestamps)

RLS policy on ALL tables:
USING (tenant_id = auth.jwt() ->> 'tenant_id')
```

### 2. API Structure
```
/api/
  /auth/          → Supabase Auth handlers
  /contacts/      → CRUD for contacts
  /conversations/ → Unified inbox
  /webhooks/
    /telnyx/      → Incoming SMS, missed calls
    /resend/      → Email events
  /workflows/     → Inngest triggers
```

### 3. Workflow Pattern (Inngest)
```typescript
// Standard pattern for all workflows
export const leadFollowUp = inngest.createFunction(
  { id: "lead-follow-up", retries: 3 },
  { event: "lead/created" },
  async ({ event, step }) => {
    await step.sleep("wait", "2m");
    await step.run("send-sms", async () => {
      await telnyx.messages.create({ ... });
    });
  }
);
```

### 4. Environment Strategy
| Environment | Purpose | Database |
|-------------|---------|----------|
| `local` | Development | Local Supabase (Docker) |
| `preview` | PR previews | Supabase branch (preview) |
| `staging` | Pre-prod testing | Supabase staging project |
| `production` | Live | Supabase production project |

---

## 📊 Scalability Checkpoints

| Users | Check | Action |
|-------|-------|--------|
| 0-1k | ✅ Current stack | Ship and learn |
| 1k-10k | Monitor Vercel limits, Supabase connections | Add connection pooling, caching |
| 10k-50k | API route latency, realtime limits | Extract backend to Hono on Fly.io |
| 50k+ | Database partitioning, read replicas | Partition by tenant_id, add Supabase replicas |

---

## 🔐 Security Checklist

- [ ] RLS enabled on ALL tables (no exceptions)
- [ ] API routes validate tenant_id from JWT
- [ ] Webhook endpoints verify signatures (Telnyx, Resend)
- [ ] Rate limiting on public endpoints
- [ ] PII encryption at rest (Supabase handles this)
- [ ] Audit log for sensitive actions (contact delete, export)

---

## ✅ Final Engineering Signoff

**Status:** ✅ **APPROVED WITH CONDITIONS**

### Conditions for P0 Launch:

1. [ ] **Google Business Profile API** — Application submitted
2. [ ] **Telnyx sandbox** — Missed call flow tested end-to-end
3. [ ] **Auth/tenant flow** — Documented before Day 1 coding
4. [ ] **RLS policies** — Reviewed by second engineer before data migration
5. [ ] **Monitoring** — Vercel Analytics + Supabase Dashboard configured

### Post-P0 Tech Debt (P1 Sprint):

- [ ] Abstract Inngest workflows for portability
- [ ] Add structured logging (Axiom or Logtail)
- [ ] Set up error tracking (Sentry)
- [ ] Document disaster recovery plan

---

```
[SENIOR PRINCIPAL ENGINEER SIGNATURE]

APPROVED for P0 development.

The stack is sound. Supabase + Vercel + Inngest is a pragmatic choice
for speed-to-market. Key risks are manageable with the mitigations noted.

Priority actions:
1. Submit Google Business Profile API application TODAY
2. Test Telnyx in sandbox within first 3 days
3. Document tenant auth flow before writing code

Ship fast, monitor closely, iterate.

— Senior Principal Engineer
   January 22, 2026
```
