# GHL Lite — P0 Sprint Task List

## ✅ Pre-Development (Day 0)

- [x] Strategy document (`lite.md`)
- [x] Staff Engineer review (`staff.md`)
- [x] Product Owner approval (`po.md`)
- [x] Principal Engineer signoff (`principal.md`)
- [ ] Apply for Google Business Profile API
- [ ] Document auth/tenant flow

---

## 🔴 P0: Speed to Lead Bundle (Days 1-14)

### Week 1: Foundation

#### Day 1-2: Project Setup
- [ ] Initialize Next.js 15 project with App Router
- [ ] Configure Tailwind CSS
- [ ] Set up Supabase project (dev + prod)
- [ ] Configure environment variables
- [ ] Set up Vercel deployment

#### Day 3-4: Auth & Multi-Tenancy
- [ ] Implement Supabase Auth (email/password)
- [ ] Create tenant/organization table
- [ ] Set up RLS policies for all tables
- [ ] Build signup → tenant creation flow
- [ ] Test tenant isolation

#### Day 5-6: Telnyx Integration
- [ ] Set up Telnyx account + sandbox
- [ ] Provision phone numbers
- [ ] Implement missed call webhook
- [ ] Build "Missed Call Text-Back" automation
- [ ] Test end-to-end missed call flow

### Week 2: Core Features

#### Day 7-8: CRM & Contacts
- [ ] Create contacts table with RLS
- [ ] Build contacts list UI
- [ ] Implement add/edit/delete contacts
- [ ] Add tags functionality
- [ ] Import contacts from CSV

#### Day 9-10: Unified Inbox
- [ ] Create conversations table
- [ ] Integrate Telnyx SMS (send/receive)
- [ ] Integrate Resend email
- [ ] Build inbox UI (WhatsApp-style)
- [ ] Implement real-time updates (Supabase Realtime)

#### Day 11-12: Forms
- [ ] Create forms table
- [ ] Build simple form builder UI
- [ ] Generate embeddable form code
- [ ] Form submission → Contact creation
- [ ] Form submission → Conversation start

#### Day 13-14: Polish & Testing
- [ ] Onboarding wizard (3 steps)
- [ ] Plumber industry template
- [ ] Usage tracking for SMS
- [ ] Error handling & edge cases
- [ ] End-to-end testing
- [ ] Deploy to production

---

## 🟡 P1: Conversion Bundle (Days 15-28)

- [ ] Pipeline (Kanban board)
- [ ] Calendar & Booking
- [ ] Workflow automations (Inngest)
- [ ] Reputation Management (Google Reviews)
- [ ] Webhooks
- [ ] Referral program

---

## 🔵 P2: AI Bundle (Days 29-45)

- [ ] FAQ Chatbot
- [ ] Appointment booking via chat
- [ ] Review response AI
- [ ] Lead scoring
- [ ] White-label option

---

## 📊 Success Metrics (P0)

| Metric | Target |
|--------|--------|
| Free signups | 500 |
| Paid conversions | 25 (5%) |
| MRR | $1,500 |

---

*Last updated: January 22, 2026*
