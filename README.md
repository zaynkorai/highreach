# HighReach - AI Native Speed to Lead Platform

HighReach is opensource platform designed effectively for "Speed to Lead" targeting local SMBs without the bloat. It leverages autonomous agents to handle SMS, Email, Booking, and Reviews.

## Mission

An open source modern tool to convert leads into customers in **minutes** using Autonomous AI Agents,

## The Core Loop

### 1. Capture

* **Unified Inbox 2.0**: Omnichannel support (SMS/Email) with AI-ready infrastructure.
* **Autonomous CRM**: Contact management with predictive activity timelines.
* **Missed Call Text-back**: Immediate response to missed calls.

### 2. Nurture

* **Workflow Engine**: Inngest-powered automation builder (Action/Wait/If-Else).
* **Reputation AI**: Sentiment analysis and auto-drafted review responses.

### 3. Close

* **Visual Pipelines**: Kanban boards for deal tracking.
* **AI Booking Agent**: Autonomous scheduling.

## 🛠️ Tech Stack & Architecture

- **Frontend/Backend**: Next.js 16 (App Router) + Server Actions + API Routes
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM (Multi-tenant application-level scoping)
- **Auth**: Custom JWT session cookies via `jose` + `bcryptjs` password hashing + RBAC
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Telephony**: Telnyx (SMS/Voice)
- **Email**: Resend
- **Background Jobs / Agent Runtime**: Inngest (Durable workflow & agent execution)
- **AI**: Vercel AI SDK + Claude 3.5 Sonnet / GPT-4o
- **Architecture**: AI-Native Data Sources $\leftrightarrow$ Autonomous Agents $\leftrightarrow$ Typed Tools (See [Architecture Blueprint](file:///Users/zayn/ground/highreach/docs/ai-native-architecture.md))
- **State Management**: Zustand (frontend) with localStorage persistence
- **Validation**: Zod (Shared frontend/backend)

| Item | Assessment |
|------|------------|
| **Tech stack** | Next.js 16 + PostgreSQL + Drizzle ORM is lean, decoupled, and self-hostable. |
| **Resend for email** | Good choice. Better deliverability than Mailgun. |
| **Telnyx for SMS** | Smart. Modern API, 50% cheaper than Twilio, includes voice for future. |
| **Inngest for workflows & agents** | Excellent for durable agent execution and "wait X → do Y" patterns. No infra to manage. |
| **PWA approach** | Right call. Avoids native app complexity. |
| **Data Sources & Agents** | Shift from rigid ERDs to grounded knowledge + autonomous tool execution. |
| **Industry templates** | Low dev cost, high marketing value. |
| **Single DB + Multi-tenant scoping** | Decoupled from vendor lock-in. |

## Project Structure

- `/web` : Web Application & API routes (Next.js)
- `/docs`: Architectural blueprints, reviews, and specs

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (Strictly used for all package management tasks)
- PostgreSQL (Local, Docker, Railway, RDS, etc.)
- Telnyx Account (Optional / for SMS)
- Resend Account (Optional / for Email)

### Installation

1. Clone the repo
2. Install dependencies (make sure you use `pnpm`):
   ```bash
   pnpm install
   ```
3. Set up environment variables (create `.env.local` inside `web/`):
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/highreach"
   AUTH_SECRET="your-secure-at-least-32-char-secret"
   ADMIN_SECRET="your-admin-secret"
   TELNYX_API_KEY=...
   RESEND_API_KEY=...
   ```
4. Run migrations:
   ```bash
   cd web && pnpm db:migrate
   ```
5. Run the development server:
   ```bash
   cd web && pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can edit functionality starting from `app/page.tsx` or `web/src/app/page.tsx`.

## Roadmap & Rollout

- [X] **Phase 0: Speed to Lead**
  - Unified inbox (SMS + Email), CRM, Missed Call Text Back, Forms, Auth, Tenant setup.
- [X] **Phase 1: Conversion Core** 
  - Pipelines, Calendars, Workflows, Reviews, Webhooks, FB/IG DMs.
- [ ] **Phase 2 (P2): AI Native Core** (See [docs/ai-native-architecture.md](file:///Users/zayn/ground/highreach/docs/ai-native-architecture.md))
  - Supabase `pgvector` Data Sources & Knowledge Grounding Engine.
  - Typed Tool Registry (Telnyx SMS, Resend Email, Calendar booking, CRM mutation).
  - Autonomous Inbound Lead & Booking Agents (replacing static canned templates).
  - Unified Inbox Copilot (AI Drafts with 1-click human approval).
  - Review Guardian Pro (LLM sentiment analysis & automated responses).

---

*Built with by the HighReach Team*
