# Gal — AI Native Speed to Lead Platform

**Gal** is an AI-native alternative to GoHighLevel (GHL), designed effectively for "Speed to Lead" without the bloat. It leverages autonomous agents to handle SMS, Email, Booking, and Reviews for local businesses (SMBs).

## 🚀 Mission
Convert leads into customers in **minutes** using Autonomous AI Agents, not manual workflows.

## ♻️ The Core Loop
### 1. Capture
*   **Unified Inbox 2.0**: Omnichannel support (SMS/Email/WhatsApp) with AI-ready infrastructure.
*   **Autonomous CRM**: Contact management with predictive activity timelines.

### 2. Nurture
*   **Workflow Engine**: Inngest-powered automation builder (Action/Wait/If-Else).
*   **Reputation AI**: Sentiment analysis and auto-drafted review responses.

### 3. Close
*   **Visual Pipelines**: Kanban boards for deal tracking.
*   **AI Booking Agent**: (Coming Soon) Autonomous scheduling.

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + RLS + PgVector)
- **Auth**: Supabase Auth (Multi-tenant)
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Telephony**: Telnyx (SMS/Voice)
- **Email**: Resend
- **Background Jobs**: Inngest
- **AI**: Vercel AI SDK + Anthropic Claude 3.5 Sonnet

## 🏗️ Project Structure
- `/app`: Frontend (Next.js)
- `/backend`: Backend services (Fastify/Node.js) - *Legacy/Microservices*
- `/docs`: Strategy and Planning artifacts (`lite.md`, `task.md`)

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- Supabase Project
- Telnyx Account
- Resend Account

### Installation

1. Clone the repo
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables (`.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   TELNYX_API_KEY=...
   RESEND_API_KEY=...
   ```
4. Run the development server:
   ```bash
   pnpm dev
   ```

## 🗺️ Roadmap
- [x] **Phase 1: Speed to Lead** (Inbox, CRM, Missed Call Text Back)
- [x] **Phase 2: Conversion Core** (Pipelines, Calendars, Workflows)
- [ ] **Phase 3: AI Native Core** (RAG Agents, Auto-Booking, Generative Config)

---
*Built with ❤️ by the Gal Team*
