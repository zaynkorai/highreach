# HighReach — AI-Native Speed to Lead & Social Growth Platform

HighReach is an open-source, multi-tenant platform purpose-built for **Speed to Lead** and **Omnichannel Lead Generation** for local SMBs, agencies, and high-growth teams. It unifies autonomous communication agents, interactive workflows, a high-converting CRM, and an omnichannel **Social Studio** (with full Postiz 2026 parity) into a single, cohesive engine.

---

## 🎯 Mission

Convert inbound inquiries and social engagement into paying customers in **seconds**, not days, through autonomous AI agents, multi-network broadcasting, and automated lead capture.

---

## ⚡️ The Core Engine

### 1. Capture & Lead Magnet Engine
* **Unified Inbox 2.0**: 3-pane omnichannel inbox supporting SMS (Telnyx), Email (Resend), and internal team notes with keyboard shortcuts and canned responses.
* **Social Studio (Postiz 2026 Parity)**: Complete social media scheduling, analytics, and lead capture platform:
  * **10 Supported Networks**: Twitter/X, LinkedIn, Facebook, Instagram, Threads, YouTube Community, Twitch, Kick, Skool, and Whop.
  * **Comment-to-Lead / Comment-to-DM**: Ingests social comments, evaluates keyword triggers (e.g. `GUIDE`, `GROWTH`), auto-dispatches personalized DMs with resource links, and **automatically inserts qualified contacts directly into HighReach's CRM**.
  * **Interactive Testing Sandbox**: Test comment triggers and preview real-time DM dispatch and CRM contact creation right from the post analytics modal.
* **Autonomous CRM**: Contact management with smart filters, tags, custom attributes, CSV batch ingestion, and interactive timeline drawers.
* **Missed Call Text-back**: Automated instant SMS responses for incoming calls when teams are unavailable.
* **Forms & Lead Capture**: Embedded and standalone forms with automated conversation handoffs.

### 2. Nurture & Consistency
* **Workflow Automations (Inngest)**: Visual drag-and-drop workflow canvas with Action, Wait, and Smart Branching (If/Else) logic nodes.
* **Evergreen Post Recycling**: Automated evergreen queue scheduling with configurable recurrence intervals, loop limits, and **AI Hook Rewriting** to bypass social algorithm duplicate content penalties.
* **Reputation AI**: Review monitoring across Google Business and Facebook with automated sentiment classification and AI-drafted reply assistance.
* **Daily Posting Streak**: Gamified consistency tracker (`🔥 X Day Streak`) with at-risk warnings and reminder notifications.

### 3. Close & Scale
* **Visual Deal Pipelines**: Interactive drag-and-drop Kanban boards with opportunity value aggregations, stage transitions, and deal metrics.
* **Client Social Connect ("Add Channels Without Login")**: Tokenized magic links allowing agencies to onboard clients' social channels in 30 seconds without sharing passwords or workspace access.
* **LinkedIn Carousel Builder**: Native multi-page document generator with slide editors, custom branding, and interactive card swipers.
* **Global Social Settings**: Tenant-wide preferences for short-linking (`Always`, `Never`, `Ask`), automated time slot presets, and default tags.

### 4. Grounding & Semantic Memory (AI-Native Core)
* **Semantic Retrieval & Knowledge Base**: Multi-tenant business context ingestion (FAQs, Service Catalogs, Pricing Sheets, Documents, URLs) stored in PostgreSQL `pgvector` (`vector(1536)`) with HNSW cosine distance indexing.
* **Hierarchical Semantic Chunking**: Smart boundary splitter preserving headings, paragraphs, and sentences with token budget calculations and sliding overlaps.
* **Hybrid Search (Reciprocal Rank Fusion)**: Combines dense vector similarity with sparse keyword matching for optimal recall and accuracy.
* **Interactive Semantic Test Bench**: Natural language query playground with live similarity threshold sliders, latency metrics, and chunk match scoring.
* **3-Pillar Context Assembler**: Foundational perception engine combining Tenant Knowledge, CRM History, and Live Omnichannel Thread to ground all autonomous agents.

---

## 🛠️ Tech Stack & Architecture

- **Web Application**: Next.js 16 (App Router) + React Server Components + Server Actions
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL with `pgvector` & Drizzle ORM (Multi-tenant RLS + HNSW vector indexing)
- **State Management**: Zustand with persistent client storage
- **Styling & UI**: Tailwind CSS v4, Lucide Icons, Shadcn UI primitives
- **Background Jobs & Workflows**: Inngest (Durable event-driven execution)
- **Telephony & SMS**: Telnyx SDK (Inbound/Outbound SMS, webhooks)
- **Email Delivery**: Resend SDK
- **Validation**: Zod (Shared schemas across client, server actions, and API routes)
- **Testing**: Node.js Test Runner (`node:test`) + Native Type Stripping (58 passing unit tests)

---

## 📁 Repository Structure

```
highreach/
├── docs/                        # Architectural documentation, blueprints & reviews
│   ├── ai-native-architecture.md# AI data sources & agent architecture blueprint
│   ├── forms.md                 # Forms & lead capture specification
│   ├── payments-invoicing-signatures.md # Payments, Invoicing & E-Signatures specification
│   ├── social-studio.md         # Social Studio & Postiz 2026 parity reference
│   ├── staff-code-quality-review.md # Code quality & security audit
│   └── task.md                  # Project task list & milestone tracking
├── web/                         # Core Next.js 16 application
│   ├── src/
│   │   ├── app/                 # Next.js App Router (Dashboard, API, Auth)
│   │   │   ├── dashboard/
│   │   │   │   ├── calendars/   # Booking & calendar management
│   │   │   │   ├── contacts/    # CRM contacts & Smart Lists
│   │   │   │   ├── inbox/       # Unified Omnichannel Inbox
│   │   │   │   ├── knowledge/   # Knowledge Base & Semantic Test Bench
│   │   │   │   ├── pipelines/   # Kanban deal pipelines
│   │   │   │   ├── reputation/  # Review monitoring & AI responses
│   │   │   │   ├── social/      # Social Studio & Postiz engine
│   │   │   │   └── automations/ # Inngest automation flow builder
│   │   ├── lib/
│   │   │   ├── ai/              # Chunking, Embeddings, Context Assembler, Semantic Search
│   │   │   ├── auth/            # JWT session handling & RBAC
│   │   │   ├── db/              # Drizzle ORM schemas & client (pgvector HNSW)
│   │   │   ├── services/        # Domain services (Knowledge, Contacts, Social)
│   │   │   ├── types/           # Core database & domain TypeScript types
│   │   │   └── validations/     # Zod validation schemas
│   │   ├── stores/              # Zustand global client stores
│   │   └── __tests__/           # Unit tests (CRM, Context Assembler, Social, Knowledge)
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (`pnpm` is strictly required for all package management tasks)
- PostgreSQL (Local instance, Docker, Supabase, Neon, or Railway)

### Quick Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/zaynkorai/highreach.git
   cd highreach
   ```

2. **Install dependencies:**
   ```bash
   cd web
   pnpm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file inside the `web/` directory:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/highreach"
   AUTH_SECRET="your-secure-at-least-32-char-secret-key"
   ADMIN_SECRET="your-admin-secret-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Optional external integrations
   TELNYX_API_KEY=""
   TELNYX_PUBLIC_KEY=""
   RESEND_API_KEY=""
   INNGEST_EVENT_KEY=""
   INNGEST_SIGNING_KEY=""
   ```

4. **Initialize Database:**
   ```bash
   pnpm db:push
   ```

5. **Run the Development Server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the automated unit test suite:
```bash
cd web
pnpm test
```

Run TypeScript compiler type verification:
```bash
cd web
pnpm tsc --noEmit
```

---

## 🛣️ Project Milestones

- [x] **P0: Speed to Lead Foundation**
  - Unified Inbox (SMS/Email), Contacts CRM with CSV import, Missed Call Text-back, Custom JWT Auth, Tenant isolation.
- [x] **P1: Conversion Core**
  - Kanban Deal Pipelines, Inngest Workflow Automation Canvas, Reputation Management with Smart Review Gate, Calendar control center.
- [x] **Social Studio (Postiz 2026 Flagship Parity)**
  - 10-Platform Scheduler (Twitter/X, LinkedIn, Facebook, Instagram, Threads, YouTube, Twitch, Kick, Skool, Whop).
  - Comment-to-Lead & Auto-DM conversion engine with direct CRM contact creation.
  - Evergreen Queue Recycling with AI Hook Rewriter.
  - Client Connect Magic Links for passwordless channel authorization.
  - LinkedIn Carousel & Slide Deck Generator.
  - Posting Streak consistency engine & single-post analytics.
- [ ] **P2: AI-Native Core & Autonomous Agents**
  - [x] PostgreSQL `pgvector` knowledge grounding engine (`tenant_knowledge_sources`, `knowledge_chunks`).
  - [x] Multi-pillar Context Assembler (`assembleAgentContext` combining Tenant Knowledge + Contact History + Active Thread).
  - [ ] Autonomous conversational booking concierge.
  - [ ] Unified Inbox Copilot (AI drafts with 1-click human approvals).

---

*Built with ❤️ by the HighReach Team*
