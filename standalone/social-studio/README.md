# Social Studio (Standalone Module)

This is an isolated, self-contained extract of the **Social Studio (Postiz 2026 Parity)** module originally created for HighReach.

## Features Included
1. **Multi-Platform Scheduler**: 10 platforms (Twitter/X, LinkedIn, Facebook, Instagram, Threads, YouTube Community, Twitch, Kick, Skool, Whop).
2. **Comment-to-Lead / Comment-to-DM Engine**: Matches keyword triggers in social comments and formats personalized automated DMs with resource links.
3. **LinkedIn Carousel Builder**: Multi-slide document editor with 4 high-contrast color themes and swiper preview.
4. **Evergreen Queue Recycling**: Automated post rescheduling with AI Hook Rewriter to avoid duplicate content penalties.
5. **Client Connect Magic Links**: Tokenized authorization URLs allowing agencies to onboard client accounts password-free.
6. **Posting Streak Consistency**: Streak tracking and at-risk alerts.
7. **Durable Inngest Scheduling**: Background dispatcher and queue sweeper (`social-publish.ts`).
8. **Unit Tests**: 16 unit tests covering pure domain logic (`__tests__/social.test.ts`).

## Directory Structure
- `src/app/dashboard/social/`: Full Next.js App Router UI (Composer, Analytics, Settings, Platform Previews).
- `src/app/portal/connect/`: Client connect authorization portal.
- `src/lib/services/`: Pure domain utilities (`social-utils.ts`) and database service (`social.service.ts`).
- `src/stores/`: Zustand client store (`social-store.ts`).
- `src/inngest/functions/`: Inngest background job definitions (`social-publish.ts`).
- `schema.ts`: Drizzle ORM schema for PostgreSQL.
- `social-studio.md`: Architecture blueprint and spec.
