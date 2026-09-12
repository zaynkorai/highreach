import { inngest } from "@/lib/inngest/client";
import { db, calendars, externalAccounts } from "@/lib/db";
import { eq, and, isNotNull, ne } from "drizzle-orm";
import { CalendarService } from "@/lib/services/calendar.service";

export const syncExternalEvents = inngest.createFunction(
    { id: "sync-external-events" },
    { cron: "0 * * * *" }, // Run every hour
    async ({ step }) => {
        // 1. Find all distinct external accounts with sync enabled
        const activeAccounts = await step.run("fetch-active-sync-accounts", async () => {
            const rows = await db
                .select({
                    tenantId: calendars.tenantId,
                    externalAccountId: calendars.externalAccountId,
                })
                .from(calendars)
                .innerJoin(externalAccounts, eq(calendars.externalAccountId, externalAccounts.id))
                .where(
                    and(
                        ne(calendars.syncDirection, "off"),
                        isNotNull(calendars.externalAccountId)
                    )
                );

            // Deduplicate tenantId + externalAccountId
            const seen = new Set<string>();
            const unique: Array<{ tenantId: string; externalAccountId: string }> = [];

            for (const r of rows) {
                if (!r.externalAccountId) continue;
                const key = `${r.tenantId}:${r.externalAccountId}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push({ tenantId: r.tenantId, externalAccountId: r.externalAccountId });
                }
            }

            return unique;
        });

        // 2. Ingest external events for each account
        for (const account of activeAccounts) {
            await step.run(`sync-account-${account.externalAccountId}`, async () => {
                try {
                    await CalendarService.syncAccountEvents(account.tenantId, account.externalAccountId);
                } catch (err) {
                    console.error(`Error syncing external account ${account.externalAccountId}:`, err);
                }
            });
        }

        return { synced_accounts: activeAccounts.length };
    }
);
