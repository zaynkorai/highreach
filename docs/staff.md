# Staff Engineer Review — HighReach

**Document:** [lite.md](file:///Users/zayn/ground/gal/lite.md)  
**Review Date:** January 22, 2026  
**Requested By:** Business/Product  
**Review Type:** Technical Feasibility & Architecture Signoff

---

## Summary of Proposal

**Product:** "HighReach" — A simplified Legacy CRM competitor targeting local SMBs.  
**Core Thesis:** Build 20% of Legacy CRM features that solve 80% of SMB pain points.

### Phased Rollout
| Phase | Timeline | Scope |
|-------|----------|-------|
| 1-7 days | Unified inbox (SMS + Email), missed call text-back, CRM, forms |
| 8-20 days | Pipeline, calendar, workflows, reviews, webhooks |
| 20-45 days | AI chat, review AI, white-label, lead scoring |

---

## 🛠️ Tech Stack (DECIDED)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Next.js 15 (App Router) + Tailwind | Best DX, RSC, fast iteration |
| **Backend** | Next.js API Routes | Single codebase, simple |
| **Database** | Supabase (PostgreSQL + RLS) | Multi-tenant ready, realtime, auth built-in |
| **Email** | Resend | Modern DX, better deliverability than Mailgun |
| **SMS/Phone** | Telnyx | Modern DX, $0.004/SMS (vs Twilio $0.008), missed-call webhooks |
| **Workflows** | Inngest | Serverless-friendly, no Redis, built-in retries |
| **AI** | Vercel AI SDK + Claude/GPT-4o | Streaming, easy integration |
| **Auth** | Supabase Auth | Built-in, handles multi-tenant |
| **Hosting** | Vercel | Zero-config, edge functions |
| **Mobile** | PWA (simple) | No native apps, responsive + installable |

### Multi-Tenancy
- **Approach:** Single DB with Row-Level Security (RLS)
- **Scale Target:** 50,000+ businesses
- **Implementation:** Supabase RLS policies per `tenant_id`

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Greenfield or existing? | **Greenfield** (starting from scratch) |
| Phone/SMS provider? | **Telnyx** (modern DX, cheaper than Twilio) |
| Mobile app? | **PWA** (simple, no over-engineering) |
| Workflow engine? | **Inngest** (serverless, no Redis) |
| Multi-tenancy? | **Single DB + RLS** (Supabase) |

---

### ADJUSTED SCOPE

| Original | Adjustment |
|----------|------------|
|  SMS + Email + FB/IG DMs | **SMS + Email only.** Add social DMs in P1 after Meta API approval (2-4 weeks). |
| 1-7 days (greenfield) |  More realistic for greenfield with auth, multi-tenancy, Telnyx setup. |

### RISKS (Mitigations Required)

| Risk | Mitigation |
|------|------------|
| **Google Reviews API** | Apply for GBP API access NOW. 2-4 week approval. |
| **SMS costs at scale** | Build usage tracking + alerts from day 1. Add to P0. |
| **Telnyx number provisioning** | Test in sandbox before P0 launch. Verify number availability in target regions. |

---

## Phase 0 Scope (Finalized)

**Timeline:** 10-14 days (adjusted from 7)

| Feature | Tech |
|---------|------|
| Auth + onboarding | Supabase Auth |
| Tenant setup | Supabase RLS |
| Unified inbox (SMS + Email) | Telnyx + Resend |
| Missed call text-back | Telnyx webhooks + Inngest |
| Contact CRM | Supabase tables |
| Form builder | Next.js + Supabase |
| Usage tracking | Supabase + dashboard |

**Deferred to Phase 1:**
- FB/IG DMs (pending Meta API approval)
- Pipeline, calendar, workflows

---

## Signoff Section

| Role | Name | Status | Date |
|------|------|--------|------|
| Staff Engineer | _______________ | ⬜ Pending | |
| Product Owner | _______________ | ⬜ Pending | |
| Engineering Lead | _______________ | ⬜ Pending | |

### Signoff Criteria
- [x] All open questions resolved
- [x] Tech stack decided
- [x] Phase 0 scope finalized with realistic timeline
- [ ] Risk mitigations confirmed
- [ ] Google Reviews API application submitted

---

**Reviewer Notes:**

```
[STAFF ENGINEER COMMENTS]
Tech stack is solid. Supabase + Telnyx + Inngest is a good modern foundation.
 
Key risks:
1. Google Reviews API - START APPLICATION IMMEDIATELY
2. Telnyx - test number provisioning in sandbox before committing
3. Timeline - 10-14 days is more realistic for greenfield

Recommend proceeding with Phase 0 scope as adjusted above.
```
