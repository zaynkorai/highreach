import { inngest } from "@/lib/inngest/client";
import { db, calendars, externalAccounts } from "@/lib/db";
import { eq, and, isNotNull, ne } from "drizzle-orm";
import * as google from "@/lib/integrations/calendar/google";
import * as outlook from "@/lib/integrations/calendar/outlook";
import { startOfDay } from "date-fns";

export const syncExternalEvents = inngest.createFunction(
    { id: "sync-external-events" },
    { cron: "0 * * * *" }, // Run every hour
    async ({ step }) => {
        // 1. Find all calendars with sync enabled
        const activeSyncs = await step.run("fetch-active-syncs", async () => {
            const rows = await db
                .select({
                    calendar: calendars,
                    externalAccount: externalAccounts,
                })
                .from(calendars)
                .innerJoin(externalAccounts, eq(calendars.externalAccountId, externalAccounts.id))
                .where(
                    and(
                        ne(calendars.syncDirection, "off"),
                        isNotNull(calendars.externalAccountId)
                    )
                );

            return rows.map(({ calendar: c, externalAccount: a }) => ({
                id: c.id,
                tenant_id: c.tenantId,
                external_account_id: c.externalAccountId,
                external_calendar_id: c.externalCalendarId,
                sync_direction: c.syncDirection,
                external_account: a,
            }));
        });

        for (const sync of activeSyncs as any[]) {
            await step.run(`sync-calendar-${sync.id}`, async () => {
                const account = sync.external_account;
                if (!account) return;

                const timeMin = startOfDay(new Date());

                if (account.provider === "google") {
                    await google.getCalendarEvents(
                        account.accessToken,
                        account.refreshToken,
                        sync.external_calendar_id || "primary",
                        timeMin
                    );
                } else if (account.provider === "outlook") {
                    await outlook.getCalendarEvents(account.accessToken);
                }

                await db
                    .update(calendars)
                    .set({ lastSyncAt: new Date(), updatedAt: new Date() })
                    .where(eq(calendars.id, sync.id));
            });
        }
    }
);
