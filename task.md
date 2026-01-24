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
- [x] Initialize Next.js 15 project with App Router
- [x] Configure Tailwind CSS
- [x] Set up Supabase project (dev + prod)
- [x] Configure environment variables
- [ ] Set up Vercel deployment

#### Day 3-4: Auth & Multi-Tenancy
- [x] Implement Supabase Auth (email/password)
- [x] Create tenant/organization table
- [x] Set up RLS policies for all tables
- [x] Build signup → tenant creation flow
- [x] Test tenant isolation

#### Day 5-6: Telnyx Integration
- [x] Set up Telnyx account + sandbox
- [x] Provision phone numbers
- [x] Implement missed call webhook
- [x] Build "Missed Call Text-Back" automation
- [ ] Test end-to-end missed call flow

### Week 2: Core Features

#### Day 7-8: CRM & Contacts
- [x] Create contacts table with RLS
- [x] Build contacts list UI
- [x] Implement add/edit/delete contacts
- [ ] Add tags functionality
- [x] Import contacts from CSV

#### Day 9-10: Unified Inbox
- [x] Create conversations table
- [x] Integrate Telnyx SMS (send/receive)
- [ ] Integrate Resend email
- [x] Build inbox UI (WhatsApp-style)
- [x] Implement real-time updates (Supabase Realtime)

#### Day 11-12: Forms (See [`forms.md`](./forms.md))
- [x] Create forms table
- [x] Build simple form builder UI
- [x] Generate embeddable form code
- [x] Form submission → Contact creation
- [ ] Form submission → Conversation start

#### Day 13-14: Polish & Testing
- [ ] Onboarding wizard (3 steps)
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
