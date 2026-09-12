# HighReach Web Application (`web/`)

This directory contains the primary web application for HighReach, built with **Next.js 16 (App Router)**, **React Server Components**, **Server Actions**, and **Drizzle ORM**.

---

## 🏗️ Architecture & Stack

- **Framework**: Next.js 16.1 (React 19, App Router)
- **Database Layer**: Drizzle ORM + PostgreSQL (`pg` pool) with multi-tenant application-level scoping
- **Authentication**: Stateless, tamper-proof JWT cookies (`jose`) + `bcryptjs` password hashing + Role-Based Access Control (Owner, Admin, Member)
- **State Management**: Zustand stores with localStorage persistence
- **Styling**: Tailwind CSS v4 + Shadcn UI primitives + Lucide React icons
- **Automations & Workflows**: Inngest durable event execution
- **Testing**: Node.js Test Runner (`node:test`) + Native Type Stripping

---

## 🚀 Available Scripts

Run all scripts inside the `web/` directory using `pnpm`:

```bash
# Start the local development server (http://localhost:3000)
pnpm dev

# Build the production bundle
pnpm build

# Start the production server
pnpm start

# Run the automated unit test suite
pnpm test

# Check TypeScript types across the entire codebase
pnpm tsc --noEmit

# Run ESLint to check code quality
pnpm lint

# Push Drizzle schema changes directly to the PostgreSQL database
pnpm db:push

# Generate Drizzle migration files
pnpm db:generate

# Launch the interactive Drizzle Studio database viewer
pnpm db:studio
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in `web/` with the following configuration:

```env
# ── Core Database & Security ──
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/highreach"
AUTH_SECRET="your-at-least-32-character-secret-key"
ADMIN_SECRET="your-admin-impersonation-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ── Telephony & Carrier (Telnyx) ──
TELNYX_API_KEY="KEY..."
TELNYX_PUBLIC_KEY="..."
TELNYX_PHONE_NUMBER="+1..."

# ── Transactional Email (Resend) ──
RESEND_API_KEY="re_..."

# ── Background Workflows (Inngest) ──
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""

# ── AI Reasoning & Vector Search ──
OPENROUTER_API_KEY=""                # Primary: OpenRouter API key for DeepSeek V4 reasoning
OPENROUTER_MODEL="deepseek/deepseek-v4" # Model slug (default: deepseek/deepseek-v4)
OPENAI_API_KEY=""                    # Fallback reasoning & text-embedding-3-small vectors

# ── Social Studio & OAuth Integrations (Optional) ──
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## 📁 Directory Structure

```
web/src/
├── app/
│   ├── (auth)/                  # Login, signup, invite acceptance
│   ├── api/                     # Public webhooks & REST API routes
│   │   ├── inngest/             # Inngest webhook runtime
│   │   ├── integrations/        # Google/Outlook OAuth endpoints
│   │   └── webhooks/            # Telnyx SMS & voice webhooks
│   └── dashboard/               # Multi-tenant authenticated control center
│       ├── calendars/           # Scheduling & booking links
│       ├── contacts/            # CRM, Smart Lists, CSV batch ingestion
│       ├── inbox/               # Unified Omnichannel Inbox
│       ├── pipelines/           # Visual deal Kanban board
│       ├── reputation/          # Google/Facebook reviews & sentiment
│       ├── settings/            # Organization, team, and billing
│       ├── social/              # Social Studio & Postiz engine
│       └── workflows/           # Inngest visual workflow builder
├── lib/
│   ├── auth/                    # Session management, JWT helpers, RBAC
│   ├── db/                      # Drizzle schema definitions & client
│   │   ├── index.ts             # DB connection pool
│   │   └── schema.ts            # PostgreSQL table definitions
│   ├── services/                # Pure business logic & service layer
│   │   ├── social.service.ts    # Social posts, accounts, and scheduling
│   │   └── social-utils.ts      # Pure domain helpers & validation
│   └── types/                   # Database interfaces & API envelopes
├── stores/                      # Zustand client stores (inbox, social, etc.)
└── __tests__/                   # Automated unit tests
    ├── action-handler.test.ts   # Safe action envelope tests
    ├── contact.csv.test.ts      # CSV ingestion tests
    ├── contact.validation.test.ts # Zod schema tests
    └── social.test.ts           # Social Studio & Postiz engine tests
```

---

## ⚡️ Key Feature Subsystems

### 1. Social Studio (`/dashboard/social`)
A high-converting social publishing and omnichannel lead generation engine:
- **10 Platforms**: Twitter/X, LinkedIn, Facebook, Instagram, Threads, YouTube, Twitch, Kick, Skool, and Whop.
- **Comment-to-Lead**: Listens for keyword triggers, personalizes DMs with `{name}`, and directly injects leads into the HighReach CRM (`contacts`).
- **Evergreen Queue**: Recycles high-performing posts automatically with AI Hook rewrites.
- **Client Connect Magic Links**: Passwordless channel connection for agency clients.
- **LinkedIn Carousel Builder**: Visual slide builder with color palettes.
- **Posting Streak**: Daily streak gamification with email reminders.

### 2. Unified Inbox 2.0 (`/dashboard/inbox`)
- 3-pane layout supporting SMS and Email in a single stream.
- Keyboard shortcuts (`Cmd+Enter` to send, status toggles).
- Omnichannel contact context sidebar and internal notes.

### 3. Visual Pipelines (`/dashboard/pipelines`)
- Drag-and-drop Kanban board powered by `@hello-pangea/dnd`.
- Stage totals and deal conversion metrics.
- Linked opportunity management with Contacts.

### 4. Workflows (`/dashboard/workflows`)
- Drag-and-drop automation builder.
- Step types: Actions (SMS, Email, Tags, Deal updates), Delays, and Branching conditions.
- Durable background execution powered by Inngest.

---

## 🧪 Running Tests

To run the unit tests:
```bash
pnpm test
```

Expected output:
```bash
ok 1 - action-handler envelope tests (5/5 pass)
ok 2 - CSV contact ingestion logic (4/4 pass)
ok 3 - contactSchema validation tests (8/8 pass)
ok 4 - Social Studio (Postiz Engine) unit tests (14/14 pass)
# tests 35, pass 35, fail 0
```
