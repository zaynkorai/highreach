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
- [x] Add tags functionality
- [x] Import contacts from CSV
- [x] **Contacts 2.0 Overhaul**
    - [x] Smart Filter Bar (Search + Source + Tags)
    - [x] Tags Management (Create/View/Assign)
    - [x] Slide-Over Drawer for Contact Details
    - [x] Visual Polish (Avatars, Typography)
    - [x] **Activity Timeline**: Notes, call logs, and interaction history in the contact drawer (fixes "hard to see history" complaint).
    - [x] **Bulk Actions**: Select multiple -> Mass Tag, Mass Delete (fixes "tedious management" complaint).
    - [x] **Saved Smart Lists**: Save current filters as a quick-access tab (fixes "repetitive filtering" complaint).

#### Day 9-10: Unified Inbox
- [x] Create conversations table
- [x] **Unified Inbox 2.0**: 3-pane layout, Internal Notes, Omnichannel support, Contact Context Sidebar.
## Error Handling & Edge Cases
- [x] Standardize Server Action Return Patterns (Contacts, Inbox, Pipelines & Forms)
- [x] Implement Row-Level CSV Upload Validation & Feedback
- [x] Add Empty State UIs & Loading Transitions (Frontend)
- [x] Reinforced Tenant Ownership Security in Actions
- [ ] Robust Form Validation: Ensure all dashboard forms use Zod with clear error messaging
- [x] Global Toast Integration: Ensure all server actions communicate failure via toasts
- [x] RLS/Permission Safety: Explicitly verify tenant ownership in server actions
- [x] Integrate Telnyx SMS (send/receive)
- [ ] Integrate Resend email
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
- [x] Error handling & edge cases
- [ ] End-to-end testing
- [ ] Deploy to production

---

## 🟡 P1: Conversion Bundle (Days 15-28)

- [x] **Pipeline (Kanban Board)**
    - [x] **Database Foundation**: 
        - [x] Create `pipelines`, `pipeline_stages`, and `opportunities` tables.
- [x] Phase 12: Pipelines UI Polish and Auth Fix
  - [x] Debug and Fix "Unauthorized" Error with Layout-level Guard
  - [x] Refactor Server Actions for Auth Stability
  - [x] Implement Premium Kanban Board and Opportunity Cards
  - [x] Support Stage Pre-selection in New Deal Modal
  - [x] Verify production stability with `pnpm build`
    - [x] **Kanban Workspace**:
        - [x] Build multi-column board with horizontal scroll.
        - [x] Implement card dragging with `@hello-pangea/dnd`.
        - [x] Add "Stage Totals" (Calculated opportunity values in headers).
    - [x] **Opportunity Management**:
        - [x] "New Opportunity" modal (linked to Contacts).
        - [x] Pipeline Switcher (Support for multiple workstreams).
        - [x] Status management (Open, Won, Lost transitions).
        - [x] **High-Grade UI Polish**: Refined Kanban board, Glassmorphism cards, and premium headers.
        - [x] **Production Stability**: Verified all routes and auth flows via `pnpm build`.
- [ ] **Calendar & Booking**
- [x] **Workflow Automations (Inngest)** (Workflow Builder Pro)
    - [x] **Step 1: Inngest Setup**
        - [x] Install Inngest SDK and Next.js integration.
        - [x] Configure Inngest client and signing key.
        - [x] Create API route `/api/inngest`.
        - [x] Set up local dev server (`npx inngest-cli`).
    - [x] **Step 2: Core Triggers**
        - [x] Define event schema (e.g., `contact.created`, `form.submitted`, `pipeline.stage_changed`).
        - [x] Implement event dispatching in existing Server Actions.
    - [x] **Step 3: Automation Flow Engine**
        - [x] **Graph Interpreter**: Built a recursive execution engine that handles `Action`, `Wait`, and `If/Else` logic paths.
        - [x] **Database Integration**: Persisted workflow graphs and immutable versions for safe execution.
        - [x] **Event Fan-out**: Implemented global listener that triggers multiple workflows based on specific events.
    - [x] **Step 4: Premium UI/UX (Pro Builder)**
        - [x] **3-Column Layout**: Element Library | Infinite Canvas | Slide-over Inspector.
        - [x] **Drag & Drop**: Direct canvas integration from the elements library.
        - [x] **Variable Picker**: Seamless injection of contact/entity data into automation templates.
        - [x] **Canvas Polish**: Added MiniMap, Controls, and Animated Edges for flow visualization.
        - [x] **Command Center**: Polished dashboard with KPI cards, Search, and Status filtering.
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

*Last updated: January 25, 2026*
