# HighReach — P0 Sprint Task List

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
    - [x] **Pro Features**:
        - [x] **Inbox Zero Workflow**: Resolve/Reopen & Status Filtering (Open/Done/All).
        - [x] **Quick Replies**: Command palette for canned responses.
        - [x] **Rich Composer**: Attachment UI & File simulation.
## Error Handling & Edge Cases
- [x] Standardize Server Action Return Patterns (Contacts, Inbox, Pipelines & Forms)
- [x] Implement Row-Level CSV Upload Validation & Feedback
- [x] Add Empty State UIs & Loading Transitions (Frontend)
- [x] Reinforced Tenant Ownership Security in Actions
- [ ] Robust Form Validation: Ensure all dashboard forms use Zod with clear error messaging
- [x] Global Toast Integration: Ensure all server actions communicate failure via toasts
- [x] RLS/Permission Safety: Explicitly verify tenant ownership in server actions
- [x] Integrate Telnyx SMS (send/receive)
- [x] Integrate Resend email (Connected to Workflows)
- [x] Implement real-time updates (Supabase Realtime)

#### Day 11-12: Forms (See [`forms.md`](./forms.md))
- [x] Create forms table
- [x] Build simple form builder UI
- [x] Generate embeddable form code
- [x] Form submission → Contact creation
- [ ] Form submission → Conversation start

#### Day 13-14: Polish & Testing
- [x] **Onboarding Wizard**: 3-step profile & company setup flow.
- [x] **Usage Tracking**: Foundation for SMS/Email metrics.
- [x] **Simple PWA Support**: Manifest, Service Worker, and Apple Mobile Web App capability.
- [x] **Forms → Conversation Link**: Automated inbox alerts for new leads.
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
    - [x] **Phase 1: Database Foundation**: Tables for calendars, availability, and appointments with multi-tenant RLS.
    - [x] **Phase 2: Admin Control Center**: UI for managing schedules, time zones, and booking links.
    - [ ] **Phase 3: Public Booking Widget**: Interactive scheduler for leads to book meetings directly. (On Hold per User Request)
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
        - [x] **Human Friendly UI**: Bezier curves, smart snapping, and compact node design.
        - [x] **Execution Control Room**: Side-over history logs with per-lead audit trails and status tracking.
        - [x] **Smart Branching**: Logic engine with Yes/No dual-path support and rule builder.
        - [x] **Lifecycle Management**: Draft vs. Live versioning with an immutable snapshot "Publish" system.
        - [x] **Functional Actions**: Multi-channel reach (Telnyx SMS + Resend Email), Tagging, and Pipeline updates.
- [x] **Reputation Management (Google & Facebook)**
    - [x] **Database Foundation**: Core schema for reviews, platforms, and official responses with tenant isolation.
    - [x] **Reputation Center UI**: 
        - [x] **Trust Score Dashboard**: Real-time aggregation of average ratings, distribution, and response rates.
        - [x] **Sentiment Analysis**: Automatic sentiment tagging and visualization (Positive/Neutral/Negative).
        - [x] **Market Insights**: AI-driven strength/opportunity extraction from review corpus.
    - [x] **Smart Review Gate**: 
        - [x] Multi-step request flow with rating-based conditional logic.
        - [x] Public redirect for high ratings (Google/Facebook).
        - [x] Private internal feedback loops for low ratings.
    - [x] **Response Command Center**:
        - [x] **AI Reply Butler**: Suggested responses based on review content and sentiment.
        - [x] **Reply Templates**: Library for standardized brand responses.
        - [x] **Unified Feed**: Omnichannel review monitoring (Google + Facebook) with advanced filtering.
- [ ] Webhooks
- [ ] Referral program

---

## 🔵 P2: AI Native Core (Data Sources & Autonomous Agents)

**Goal:** Shift from traditional static CRM features to **Data Sources $\leftrightarrow$ Autonomous Agents $\leftrightarrow$ Typed Tools** architecture.  
*Architecture Blueprint:* [docs/ai-native-architecture.md](file:///Users/zayn/ground/highreach/docs/ai-native-architecture.md)

- [ ] **Data Sources & Grounding Engine**
    - [ ] **Vector Storage Foundation**: PostgreSQL `pgvector` setup with Drizzle ORM schemas for semantic retrieval (`tenant_knowledge_sources`, `knowledge_chunks`).
    - [ ] **Knowledge Base Management**: Multi-tenant UI/API to ingest business hours, FAQs, pricing, service catalogs.
    - [ ] **Context Assembler**: Engine to dynamically construct working memory ($\text{Tenant Knowledge} + \text{Contact History} + \text{Active Thread}$).

- [ ] **Typed Tool Registry (Action Capabilities)**
    - [ ] **AI SDK Foundation**: Core integration with Vercel AI SDK (`ai`).
    - [ ] **Telephony & Messaging Tools**: `send_sms` (Telnyx) and `send_email` (Resend).
    - [ ] **Calendar Tools**: `check_availability` and `book_appointment` across connected Google/Outlook calendars.
    - [ ] **CRM State Mutation Tools**: `update_pipeline_stage`, `tag_contact`, `create_lead_note`.
    - [ ] **Escalation Tool**: `escalate_to_human` with urgency level and context reasoning.

- [ ] **Autonomous Agents (Durable Inngest Execution)**
    - [ ] **Speed-to-Lead Agent**: Replaces static missed-call and new-lead auto-responders with context-aware lead qualification.
    - [ ] **Booking Concierge Agent**: Autonomous conversational negotiation of open calendar slots.
    - [ ] **Review Guardian Pro**: True LLM-powered sentiment analysis and context-grounded public review replies (replacing mock functions in `reputation-store.ts`).

- [ ] **Supervision, Guardrails & Unified Inbox Copilot**
    - [ ] **Tenant Autonomy Policy**: Configurable `draft_only` vs `auto_pilot` modes with confidence score thresholds.
    - [ ] **Inbox AI Drafts**: Generates suggested replies directly in the Unified Inbox with 1-click human approval.
    - [ ] **Agent Run Traces**: Audit logs capturing perception context, reasoning thoughts, and actions taken.

---

## 📊 Success Metrics (P0)

| Metric | Target |
|--------|--------|
| Free signups | 500 |
| Paid conversions | 25 (5%) |
| MRR | $1,500 |

---

*Last updated: January 26, 2026*
