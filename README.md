# HighReach — AI-Native Speed to Lead Platform

HighReach is an open-source, multi-tenant platform purpose-built for **Speed to Lead** and **Autonomous Inbound Conversion** for local SMBs, service businesses, and high-growth teams. It unifies autonomous communication agents, interactive booking schedules, a high-converting CRM, and grounded semantic retrieval into a single, cohesive engine.

---

## 🎯 Mission

Convert inbound inquiries and missed calls into booked appointments in **seconds**, not days, through autonomous AI agents grounded in business knowledge.

---

## ⚡️ The Core Engine

### 1. Capture & Lead Magnet Engine
* **Unified Inbox 2.0**: 3-pane omnichannel inbox supporting SMS (Telnyx), Email (Resend), and internal team notes with keyboard shortcuts and canned responses.
* **Autonomous CRM**: Contact management with smart filters, tags, custom attributes, CSV batch ingestion, and interactive timeline drawers.
* **Missed Call Text-back**: Automated instant SMS responses for incoming calls when teams are unavailable.
* **Forms & Lead Capture**: Embedded and standalone forms with automated conversation handoffs.

### 2. Nurture & Conversion
* **Workflow Automations (Inngest)**: Event-driven automation engine with Action, Wait, and Smart Branching (If/Else) logic.
* **Reputation AI**: Review monitoring across Google Business and Facebook with automated sentiment classification and AI-drafted reply assistance.
* **Calendars & Booking**: Admin schedule control, availability windows, and appointment booking management.
* **Visual Deal Pipelines**: Interactive drag-and-drop Kanban boards with opportunity value aggregations, stage transitions, and deal metrics.

### 3. Grounding & Semantic Memory (AI-Native Core)
* **Semantic Retrieval & Knowledge Base**: Multi-tenant business context ingestion (FAQs, Service Catalogs, Pricing Sheets, Documents, URLs) stored in PostgreSQL `pgvector` (`vector(1536)`) with HNSW cosine distance indexing.
* **Hierarchical Semantic Chunking**: Smart boundary splitter preserving headings, paragraphs, and sentences with token budget calculations and sliding overlaps.
* **Hybrid Search (Reciprocal Rank Fusion)**: Combines dense vector similarity with sparse keyword matching for optimal recall and accuracy.
* **Interactive Semantic Test Bench**: Natural language query playground with live similarity threshold sliders, latency metrics, and chunk match scoring.
* **3-Pillar Context Assembler**: Foundational perception engine combining Tenant Knowledge, CRM History, and Live Omnichannel Thread to ground all autonomous agents.

---

> [!NOTE]
> **Social Studio**: The multi-network social media scheduler and Postiz parity module has been extracted into [`standalone/social-studio/`](./standalone/social-studio/) as an independent standalone package.

## 🛠️ Tech Stack & Architecture

- **Web Application**: Next.js 16 (App Router) + React Server Components + Server Actions
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL with `pgvector` & Drizzle ORM (Multi-tenant RLS + HNSW vector indexing)
- **State Management**: Zustand with persistent client storage
- **Styling & UI**: Tailwind CSS v4, Lucide Icons, Shadcn UI primitives, Ergonomic OKLCH Design System (Earthen Bone `#F6F4EF`, Searing Terracotta `#D94826`, Smoked Obsidian `#121316`)
- **Background Jobs & Workflows**: Inngest (Durable event-driven execution)
- **Telephony & SMS**: Telnyx SDK (Inbound/Outbound SMS, webhooks)
- **Email Delivery**: Resend SDK
- **Validation**: Zod (Shared schemas across client, server actions, and API routes)
- **Testing**: Node.js Test Runner (`node:test`) + Native Type Stripping (122 passing unit tests)

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
- [ ] **P2: AI-Native Core & Autonomous Agents**
  - [x] PostgreSQL `pgvector` knowledge grounding engine (`tenant_knowledge_sources`, `knowledge_chunks`).
  - [x] Multi-pillar Context Assembler (`assembleAgentContext` combining Tenant Knowledge + Contact History + Active Thread).
  - [ ] Autonomous conversational booking concierge.
  - [ ] Unified Inbox Copilot (AI drafts with 1-click human approvals).

---

*Built with ❤️ by the HighReach Team*
