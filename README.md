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

- **Frontend/Backend**: Next.js 15 (App Router) + API Routes
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + RLS + PgVector, Multi-tenant single DB)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Telephony**: Telnyx (SMS/Voice)
- **Email**: Resend
- **Background Jobs**: Inngest (Serverless-friendly)
- **AI**: Vercel AI SDK + Claude 3.5 Sonnet / GPT-4o
- **State Management**: Zustand (frontend) with localStorage persistence
- **Validation**: Zod (Shared frontend/backend)

| Item | Assessment |
|------|------------|
| **Tech stack** | Supabase + Vercel + Next.js is battle-tested. |
| **Resend for email** | Good choice. Better deliverability than Mailgun. |
| **Telnyx for SMS** | Smart. Modern API, 50% cheaper than Twilio, includes voice for future. |
| **Inngest for workflows** | Excellent for "wait X → do Y" patterns. No infra to manage. |
| **PWA approach** | Right call. Avoids native app complexity. |
| **AI scope (25% for 90%)** | Smart. Avoids Voice AI infrastructure cost. |
| **Industry templates** | Low dev cost, high marketing value. |
| **Single DB + RLS** | Correct for 50k tenants. Partition later if needed. |

## Project Structure

- `/web` : Frontend & API routes (Next.js)
- `/app`: Mobile App coming soon
- `/backend`: Backend services (Fastify/Node.js)

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (Strictly used for all package management tasks)
- Supabase Project
- Telnyx Account
- Resend Account

### Installation

1. Clone the repo
2. Install dependencies (make sure you use `pnpm`):
   ```bash
   pnpm install
   ```
3. Set up environment variables (create `.env.local` inside your Next.js directory):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   TELNYX_API_KEY=...
   RESEND_API_KEY=...
   ```
4. Run the development server (e.g., in `/app` or root, depending on your setup):
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can edit functionality starting from `app/page.tsx` or `web/src/app/page.tsx`.

## Roadmap & Rollout

- [X] **Phase 0: Speed to Lead**
  - Unified inbox (SMS + Email), CRM, Missed Call Text Back, Forms, Auth, Tenant setup.
- [X] **Phase 1: Conversion Core** 
  - Pipelines, Calendars, Workflows, Reviews, Webhooks, FB/IG DMs.
- [ ] **Phase 2 (P2): AI Native Core** (20-45 days)
  - AI chat (RAG Agents), Review AI, Auto-Booking, White-label, Lead scoring.

---

*Built with by the HighReach Team*
