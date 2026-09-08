import { inngest } from "@/lib/inngest/client";
import { db, appointments, calendars, contacts, externalAccounts } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as google from "@/lib/integrations/calendar/google";
import * as outlook from "@/lib/integrations/calendar/outlook";

export const pushToExternalCalendar = inngest.createFunction(
    { id: "push-to-external-calendar" },
    { event: "appointment.booked" },
    async ({ event, step }) => {
        const { appointment_id } = event.data;

        // 1. Fetch appointment details with calendar sync settings
        const appointment = await step.run("fetch-appointment", async () => {
            const [appt] = await db
                .select({
                    appointment: appointments,
                    calendar: calendars,
                    contact: contacts,
                })
                .from(appointments)
                .innerJoin(calendars, eq(appointments.calendarId, calendars.id))
                .innerJoin(contacts, eq(appointments.contactId, contacts.id))
                .where(eq(appointments.id, appointment_id))
                .limit(1);

            if (!appt) return null;

            let extAccount = null;
            if (appt.calendar.externalAccountId) {
                const [acc] = await db
                    .select()
                    .from(externalAccounts)
                    .where(eq(externalAccounts.id, appt.calendar.externalAccountId))
                    .limit(1);
                extAccount = acc;
            }

            return {
                id: appt.appointment.id,
                start_time: appt.appointment.startTime.toISOString(),
                end_time: appt.appointment.endTime.toISOString(),
                notes: appt.appointment.notes,
                calendar: {
                    sync_direction: appt.calendar.syncDirection,
                    external_calendar_id: appt.calendar.externalCalendarId,
                    external_account: extAccount,
                },
                contact: {
                    first_name: appt.contact.firstName,
                    last_name: appt.contact.lastName,
                    email: appt.contact.email,
                },
            };
        });

        if (!appointment || !appointment.calendar) return { skipped: "no-appointment-or-calendar" };
        const { calendar } = appointment;

        if (calendar.sync_direction === "off" || !calendar.external_account) {
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
            attendees: [{ email: appointment.contact?.email }],
        };

        // 3. Push to provider
        if (externalAccount.provider === "google") {
            await step.run("push-to-google", async () => {
                const result = await google.createCalendarEvent(
                    externalAccount.accessToken,
                    externalAccount.refreshToken || undefined,
                    calendar.external_calendar_id || "primary",
                    {
                        summary: eventPayload.summary,
                        description: eventPayload.description,
                        start: { dateTime: eventPayload.start.dateTime },
                        end: { dateTime: eventPayload.end.dateTime },
                    }
                );

                await db
                    .update(appointments)
                    .set({
                        externalEventId: result.id,
                        externalProvider: "google",
                        updatedAt: new Date(),
                    })
                    .where(eq(appointments.id, appointment_id));
            });
        } else if (externalAccount.provider === "outlook") {
            await step.run("push-to-outlook", async () => {
                const result = await outlook.createCalendarEvent(
                    externalAccount.accessToken,
                    {
                        subject: eventPayload.summary,
                        body: { contentType: "text", content: eventPayload.description },
                        start: { dateTime: eventPayload.start.dateTime, timeZone: "UTC" },
                        end: { dateTime: eventPayload.end.dateTime, timeZone: "UTC" },
                    }
                );

                await db
                    .update(appointments)
                    .set({
                        externalEventId: result.id,
                        externalProvider: "outlook",
                        updatedAt: new Date(),
                    })
                    .where(eq(appointments.id, appointment_id));
            });
        }

        return { success: true };
    }
);
