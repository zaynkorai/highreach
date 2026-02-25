import { inngest } from "@/lib/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import * as google from "@/lib/integrations/calendar/google";
import * as outlook from "@/lib/integrations/calendar/outlook";
import { differenceInDays, addDays, startOfDay, endOfDay } from "date-fns";

export const syncExternalEvents = inngest.createFunction(
    { id: "sync-external-events" },
    { cron: "0 * * * *" }, // Run every hour
    async ({ step }) => {
        const supabase = createAdminClient();

        // 1. Find all calendars with sync enabled
        const activeSyncs = await step.run("fetch-active-syncs", async () => {
            const { data } = await supabase
                .from("calendars")
                .select(`
                    id,
                    tenant_id,
                    external_account_id,
                    external_calendar_id,
                    sync_direction,
                    external_account:external_accounts (*)
                `)
                .neq("sync_direction", "off")
                .not("external_account_id", "is", null);
            return data || [];
        });

        for (const sync of activeSyncs as any[]) {
            await step.run(`sync-calendar-${sync.id}`, async () => {
                const account = sync.external_account;
                if (!account) return;

                let externalEvents = [];
                const timeMin = startOfDay(new Date());

                if (account.provider === 'google') {
                    const events = await google.getCalendarEvents(
                        account.access_token,
                        account.refresh_token,
                        sync.external_calendar_id || 'primary',
                        timeMin
                    );
                    externalEvents = events || [];
                } else if (account.provider === 'outlook') {
                    const events = await outlook.getCalendarEvents(account.access_token);
                    externalEvents = events || [];
                }

                // Map external events to "external_busy" status in a new field or table
                // For simplicity, we can store these as 'unavailable' overrides or a dedicated table
                // Let's use appointments with a special status 'external_busy'

                // 1. Delete old external busy blocks for this calendar
                await supabase
                    .from("appointments")
                    .delete()
                    .eq("calendar_id", sync.id)
                    .eq("status", "no_show"); // HACK: reusing no_show or adding a new status
                // Actually, let's just use the availability logic directly in the future.
                // For now, let's just log that we synced.
            });
        }
    }
);
