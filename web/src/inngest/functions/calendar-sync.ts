import { inngest } from "@/lib/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import * as google from "@/lib/integrations/calendar/google";
import * as outlook from "@/lib/integrations/calendar/outlook";

export const pushToExternalCalendar = inngest.createFunction(
    { id: "push-to-external-calendar" },
    { event: "appointment.booked" },
    async ({ event, step }) => {
        const { appointment_id, tenant_id } = event.data;
        const supabase = createAdminClient();

        // 1. Fetch appointment details with calendar sync settings
        const appointment = await step.run("fetch-appointment", async () => {
            const { data } = await supabase
                .from("appointments")
                .select(`
                    *,
                    calendar:calendars (
                        sync_direction,
                        external_account_id,
                        external_calendar_id,
                        external_account:external_accounts (*)
                    ),
                    contact:contacts (first_name, last_name, email)
                `)
                .eq("id", appointment_id)
                .single();
            return data;
        });

        if (!appointment || !appointment.calendar) return { skipped: "no-appointment-or-calendar" };
        const { calendar } = appointment;

        if (calendar.sync_direction === 'off' || !calendar.external_account) {
            return { skipped: "sync-disabled" };
        }

        const externalAccount = calendar.external_account;
        const contactName = `${appointment.contact?.first_name} ${appointment.contact?.last_name || ""}`.trim();

        // 2. Prepare event payload
        const eventPayload = {
            summary: `Booking: ${contactName}`,
            description: appointment.notes || `Appointment via HighReach`,
            start: { dateTime: appointment.start_time },
            end: { dateTime: appointment.end_time },
            attendees: [
                { email: appointment.contact?.email }
            ]
        };

        // 3. Push to provider
        if (externalAccount.provider === 'google') {
            await step.run("push-to-google", async () => {
                const result = await google.createCalendarEvent(
                    externalAccount.access_token,
                    externalAccount.refresh_token,
                    calendar.external_calendar_id || 'primary',
                    {
                        summary: eventPayload.summary,
                        description: eventPayload.description,
                        start: { dateTime: eventPayload.start.dateTime },
                        end: { dateTime: eventPayload.end.dateTime },
                    }
                );

                await supabase.from("appointments").update({
                    external_event_id: result.id,
                    external_provider: 'google'
                }).eq("id", appointment_id);
            });
        } else if (externalAccount.provider === 'outlook') {
            await step.run("push-to-outlook", async () => {
                const result = await outlook.createCalendarEvent(
                    externalAccount.access_token,
                    {
                        subject: eventPayload.summary,
                        body: { contentType: 'text', content: eventPayload.description },
                        start: { dateTime: eventPayload.start.dateTime, timeZone: 'UTC' },
                        end: { dateTime: eventPayload.end.dateTime, timeZone: 'UTC' },
                    }
                );

                await supabase.from("appointments").update({
                    external_event_id: result.id,
                    external_provider: 'outlook'
                }).eq("id", appointment_id);
            });
        }

        return { success: true };
    }
);
